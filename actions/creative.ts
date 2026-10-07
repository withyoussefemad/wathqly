"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/actions/workspace";
import {
  createBoardSchema,
  createConnectorSchema,
  createNodeSchema,
  createTemplateSchema,
} from "@/schemas/creative";
import type {
  CreativeBoard,
  CreativeNode,
  CreativeTemplate,
} from "@/lib/supabase/types";

const demoBoards: CreativeBoard[] = [];
const demoTemplates: CreativeTemplate[] = [];

async function resolveWorkspace() {
  return (await getActiveWorkspace())?.id || "demo-ws-1";
}

async function getSupabaseSafe() {
  try {
    const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project"));
    return configured ? await createClient() : null;
  } catch {
    return null;
  }
}

export async function getCreativeBoardsAction(): Promise<CreativeBoard[]> {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("creative_boards").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false });
    if (!error) return data as CreativeBoard[];
  }
  return demoBoards.filter((board) => board.workspace_id === workspaceId);
}

export async function createCreativeBoardAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createBoardSchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid board data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("creative_boards").insert({ id: parsed.data.id, workspace_id: workspaceId, name: parsed.data.name, description: parsed.data.description }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/whiteboards");
    return { success: true, data };
  }
  const data = { id: parsed.data.id, workspace_id: workspaceId, name: parsed.data.name, description: parsed.data.description, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), nodes: [], connectors: [] } as unknown as CreativeBoard;
  demoBoards.unshift(data);
  revalidatePath("/whiteboards");
  return { success: true, data };
}

export async function createCreativeNodeAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createNodeSchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid node data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("creative_nodes").insert({ id: parsed.data.id, workspace_id: workspaceId, board_id: parsed.data.boardId, name: parsed.data.name, x: parsed.data.x, y: parsed.data.y, width: parsed.data.width, height: parsed.data.height, color: parsed.data.color, description: parsed.data.description, kind: parsed.data.kind }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/whiteboards");
    return { success: true, data };
  }
  const data = { ...parsed.data, workspace_id: workspaceId, board_id: parsed.data.boardId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as unknown as CreativeNode;
  revalidatePath("/whiteboards");
  return { success: true, data };
}

export async function updateCreativeNodeAction(id: string, x: number, y: number) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("creative_nodes").update({ x, y, updated_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspaceId).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/whiteboards");
    return { success: true, data };
  }
  revalidatePath("/whiteboards");
  return { success: true };
}

export async function createCreativeConnectorAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createConnectorSchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid connector data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("creative_connectors").insert({ id: parsed.data.id, workspace_id: workspaceId, board_id: parsed.data.boardId, source_node_id: parsed.data.sourceNodeId, target_node_id: parsed.data.targetNodeId, color: parsed.data.color, label: parsed.data.label }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/whiteboards");
    return { success: true, data };
  }
  revalidatePath("/whiteboards");
  return { success: true };
}

export async function createCreativeTemplateAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createTemplateSchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid template data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("creative_templates").insert({ workspace_id: workspaceId, name: parsed.data.name, kind: parsed.data.kind, nodes: parsed.data.nodes, connectors: parsed.data.connectors }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/whiteboards");
    return { success: true, data };
  }
  const data = { id: `template-${Date.now()}`, workspace_id: workspaceId, ...parsed.data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as unknown as CreativeTemplate;
  demoTemplates.unshift(data);
  revalidatePath("/whiteboards");
  return { success: true, data };
}

export async function getCreativeTemplatesAction(): Promise<CreativeTemplate[]> {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("creative_templates").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false });
    if (!error) return data as CreativeTemplate[];
  }
  return demoTemplates.filter((template) => template.workspace_id === workspaceId);
}

export async function saveCreativeBoardAction(input: {
  boardId: string;
  workspaceId: string;
  elements: Array<Record<string, unknown>>;
  connectors: Array<Record<string, unknown>>;
}) {
  const workspaceId = input.workspaceId || await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { error } = await supabase.from("creative_boards").update({
      updated_at: new Date().toISOString(),
      payload: {
        elements: input.elements,
        connectors: input.connectors,
      },
    }).eq("id", input.boardId).eq("workspace_id", workspaceId);
    if (error) return { success: false, message: error.message };
  }
  revalidatePath("/whiteboards");
  return { success: true };
}
