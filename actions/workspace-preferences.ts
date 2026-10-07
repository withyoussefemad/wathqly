"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/actions/workspace";
import {
  DEFAULT_SIDEBAR_PREFERENCES,
  normalizeSidebarPreferences,
  type SidebarPreferences,
} from "@/lib/utils/sidebar-preferences";
import type { WorkspaceUserPreference } from "@/lib/supabase/types";

export async function getSidebarPreferencesAction(): Promise<SidebarPreferences> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ...DEFAULT_SIDEBAR_PREFERENCES };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...DEFAULT_SIDEBAR_PREFERENCES };

  const { data } = await supabase
    .from("workspace_user_preferences")
    .select("preferences")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const preferenceRow = data as WorkspaceUserPreference | null;

  return normalizeSidebarPreferences(preferenceRow?.preferences ?? null);
}

export async function updateSidebarPreferencesAction(
  preferences: SidebarPreferences,
): Promise<{ success: boolean; message?: string }> {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Authentication required" };

  const normalized = normalizeSidebarPreferences(preferences);
  const existingPreference = await supabase
    .from("workspace_user_preferences")
    .select("workspace_id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingPreference.error) {
    return { success: false, message: existingPreference.error.message };
  }

  const preferencePayload = {
    workspace_id: workspace.id,
    user_id: user.id,
    preferences: normalized,
    updated_at: new Date().toISOString(),
  };

  // The Supabase generated client in this repository does not yet resolve this new table's overload.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preferencesTable = supabase.from("workspace_user_preferences") as any;
  const result = existingPreference.data
    ? await preferencesTable.update({ preferences: normalized, updated_at: preferencePayload.updated_at })
        .eq("workspace_id", workspace.id)
        .eq("user_id", user.id)
    : await preferencesTable.insert(preferencePayload);

  if (result.error) return { success: false, message: result.error.message };
  revalidatePath("/", "layout");
  return { success: true };
}
