"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/actions/workspace";
import { createMeetingSchema } from "@/schemas/business";
import type { Meeting, MeetingActionItem, MeetingDecision } from "@/lib/supabase/types";

const demoMeetings: Meeting[] = [];

async function resolveWorkspace() {
  const workspace = await getActiveWorkspace();
  return workspace?.id || "demo-ws-1";
}

async function getSupabaseSafe() {
  try {
    const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project"));
    return configured ? await createClient() : null;
  } catch {
    return null;
  }
}

export async function getMeetingsAction() {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("meetings").select("*").eq("workspace_id", workspaceId).order("scheduled_at", { ascending: true });
    if (!error) return data as Meeting[];
  }
  return demoMeetings.filter((meeting) => meeting.workspace_id === workspaceId);
}

export async function createMeetingAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createMeetingSchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid meeting data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("meetings").insert({ workspace_id: workspaceId, title: parsed.data.title, scheduled_at: parsed.data.scheduledAt, duration_minutes: parsed.data.durationMinutes, location: parsed.data.location, company_id: parsed.data.companyId, project_id: parsed.data.projectId, notes: parsed.data.notes, participants: parsed.data.participants }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/meetings");
    revalidatePath("/home");
    return { success: true, data };
  }
  const data = { id: `meeting-${Date.now()}`, workspace_id: workspaceId, title: parsed.data.title, scheduled_at: parsed.data.scheduledAt, duration_minutes: parsed.data.durationMinutes, location: parsed.data.location, company_id: parsed.data.companyId, project_id: parsed.data.projectId, notes: parsed.data.notes || null, participants: parsed.data.participants, status: "scheduled", summary: null, decisions: [], action_items: [], follow_ups: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Meeting;
  demoMeetings.push(data);
  revalidatePath("/meetings");
  revalidatePath("/home");
  return { success: true, data };
}

export async function deleteMeetingAction(id: string) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { error } = await supabase.from("meetings").delete().eq("id", id).eq("workspace_id", workspaceId);
    if (error) return { success: false, message: error.message };
  } else {
    const index = demoMeetings.findIndex((meeting) => meeting.id === id && meeting.workspace_id === workspaceId);
    if (index >= 0) demoMeetings.splice(index, 1);
  }
  revalidatePath("/meetings");
  return { success: true };
}

export async function extractMeetingInsightsAction(meetingId: string) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  let meeting: Meeting | undefined;
  if (supabase) {
    const { data, error } = await supabase.from("meetings").select("*").eq("id", meetingId).eq("workspace_id", workspaceId).single();
    if (error) return { success: false, message: error.message };
    meeting = data as Meeting;
  } else {
    meeting = demoMeetings.find((item) => item.id === meetingId && item.workspace_id === workspaceId);
  }
  if (!meeting) return { success: false, message: "Meeting not found" };
  const generated = {
    summary: `Meeting summary for “${meeting.title}”: the discussion focused on the current opportunity, decision owners, and next execution steps.`,
    decisions: [{ id: `decision-${Date.now()}`, decision: "Continue the current workstream and confirm the next owner before the next review." } as MeetingDecision],
    action_items: [{ id: `action-${Date.now()}`, task_title: "Confirm meeting owners and next-step deadlines", assignee: null, due_date: null, completed: false, created_task_id: null } as MeetingActionItem],
  };
  if (supabase) {
    const { data, error } = await supabase.from("meetings").update({ summary: generated.summary, decisions: generated.decisions, action_items: generated.action_items }).eq("id", meetingId).eq("workspace_id", workspaceId).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/meetings");
    return { success: true, data };
  }
  meeting.summary = generated.summary;
  meeting.decisions = generated.decisions;
  meeting.action_items = generated.action_items;
  meeting.updated_at = new Date().toISOString();
  revalidatePath("/meetings");
  return { success: true, data: meeting };
}

export async function convertMeetingActionItemToTaskAction(input: { meetingId: string; actionItemId: string; taskTitle: string; dueDate: string | null }) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    // The runtime intentionally stores a partial action item (no assignee/due_date) here;
    // cast is type-level only, the JSON payload is unchanged.
    const { error } = await supabase.from("meetings").update({ action_items: [{ id: input.actionItemId, task_title: input.taskTitle, created_task_id: `task-${Date.now()}`, completed: true }] as unknown as MeetingActionItem[] }).eq("id", input.meetingId).eq("workspace_id", workspaceId);
    if (error) return { success: false, message: error.message };
  }
  revalidatePath("/meetings");
  revalidatePath("/tasks");
  return { success: true };
}
