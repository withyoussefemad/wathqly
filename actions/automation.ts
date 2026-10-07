"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/actions/workspace";
import { executeAutomation } from "@/lib/automation/runner";
import { automationRuleSchema, type AutomationRuleInput } from "@/schemas/automation";
import type { Automation, AutomationRun, Notification } from "@/lib/supabase/types";

export async function getAutomationDashboardAction() {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false as const, message: "Select a workspace to view automations.", automations: [], runs: [], notifications: [] };

  const supabase = await createClient();
  const [automationResult, runResult, notificationResult] = await Promise.all([
    supabase.from("automations").select("*").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }),
    supabase.from("automation_runs").select("*").eq("workspace_id", workspace.id).order("started_at", { ascending: false }).limit(50),
    supabase.from("notifications").select("*").eq("workspace_id", workspace.id).order("created_at", { ascending: false }).limit(50),
  ]);

  const error = automationResult.error || runResult.error || notificationResult.error;
  if (error) return { success: false as const, message: error.message, automations: [], runs: [], notifications: [] };
  return {
    success: true as const,
    automations: (automationResult.data || []) as Automation[],
    runs: (runResult.data || []) as AutomationRun[],
    notifications: (notificationResult.data || []) as Notification[],
  };
}

export async function createAutomationAction(input: Record<string, unknown>) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "Select a workspace first." };
  const parsed = automationRuleSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Invalid automation." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Sign in to create an automation." };

  const { error } = await supabase.from("automations").insert({
    ...parsed.data,
    workspace_id: workspace.id,
    created_by: user.id,
  });
  if (error) return { success: false, message: error.message };
  revalidatePath("/automations");
  return { success: true };
}

export async function toggleAutomationAction(id: string, enabled: boolean) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace." };
  const supabase = await createClient();
  const { error } = await supabase.from("automations").update({ enabled, updated_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspace.id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/automations");
  return { success: true };
}

export async function deleteAutomationAction(id: string) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace." };
  const supabase = await createClient();
  const { error } = await supabase.from("automations").delete().eq("id", id).eq("workspace_id", workspace.id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/automations");
  return { success: true };
}

export async function runAutomationNowAction(id: string) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("automations").select("*").eq("id", id).eq("workspace_id", workspace.id).maybeSingle();
  if (error || !data) return { success: false, message: error?.message || "Automation not found." };
  const result = await executeAutomation(supabase, data as Automation, { source: "manual" }, { force: true });
  revalidatePath("/automations");
  return result;
}

export async function runAutomationTriggerAction(
  triggerType: Exclude<AutomationRuleInput["trigger_type"], "schedule">,
  event: Record<string, unknown>,
) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("automations").select("*").eq("workspace_id", workspace.id).eq("enabled", true).eq("trigger_type", triggerType);
  if (error) return { success: false, message: error.message };

  const results = await Promise.all((data || []).map((automation) => executeAutomation(supabase, automation as Automation, event)));
  if (results.length) revalidatePath("/automations");
  return { success: results.every((result) => result.success), results };
}

export async function markNotificationReadAction(id: string) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Authentication required." };
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspace.id).eq("user_id", user.id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/automations");
  return { success: true };
}
