"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createWorkspaceSchema } from "@/schemas/workspace";
import type { Workspace, WorkspaceMember } from "@/lib/supabase/types";

const ACTIVE_WORKSPACE_COOKIE = "wathqly_active_workspace";

export async function getUserWorkspaces(): Promise<Workspace[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: members, error } = await supabase
    .from("workspace_members")
    .select(`
      workspace_id,
      role,
      workspaces (*)
    `)
    .eq("user_id", user.id);

  if (error || !members) {
    return [];
  }

  return members
    .map((m: any) => m.workspaces as Workspace)
    .filter(Boolean);
}

export async function getActiveWorkspace(): Promise<Workspace | null> {
  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const workspaces = await getUserWorkspaces();

  if (workspaces.length === 0) {
    return null;
  }

  if (activeId) {
    const found = workspaces.find((w) => w.id === activeId);
    if (found) return found;
  }

  // Fallback to first available workspace
  const defaultWs = workspaces[0];
  if (defaultWs) {
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, defaultWs.id, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return defaultWs;
  }

  return null;
}

export async function setActiveWorkspaceAction(workspaceId: string): Promise<boolean> {
  const workspaces = await getUserWorkspaces();
  const isMember = workspaces.some((w) => w.id === workspaceId);

  if (!isMember) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return true;
}

export async function createWorkspaceAction(formData: FormData) {
  const name = formData.get("name") as string;
  let slug = formData.get("slug") as string;

  if (!slug) {
    slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + "-" + Math.random().toString(36).substring(2, 7);
  }

  const parsed = createWorkspaceSchema.safeParse({ name, slug });
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid workspace information",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "You must be authenticated to create a workspace",
    };
  }

  // Insert workspace
  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug || slug,
      created_by: user.id,
    } as any)
    .select()
    .single();

  if (wsError || !ws) {
    return {
      success: false,
      message: wsError?.message || "Failed to create workspace",
    };
  }

  const createdWs = ws as unknown as Workspace;

  // Insert membership as owner
  await supabase.from("workspace_members").insert({
    workspace_id: createdWs.id,
    user_id: user.id,
    role: "owner",
  } as any);

  // Set active cookie
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, createdWs.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return {
    success: true,
    data: createdWs,
  };
}
