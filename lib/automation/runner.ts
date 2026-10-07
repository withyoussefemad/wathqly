import type { SupabaseClient } from "@supabase/supabase-js";
import { getNextAutomationRun, matchesAutomationConditions, type AutomationEvent } from "@/features/automation/engine";
import type { Automation, Database } from "@/lib/supabase/types";
import type { AutomationAction, AutomationCondition } from "@/schemas/automation";

export async function executeAutomation(
  supabase: SupabaseClient<Database>,
  automation: Automation,
  event: AutomationEvent,
  options: { force?: boolean; advanceSchedule?: boolean } = {},
) {
  const startedAt = new Date();
  const actionResults: Array<Record<string, unknown>> = [];
  let status: "success" | "failed" | "skipped" = "success";
  let errorMessage: string | null = null;

  if (!options.force && !matchesAutomationConditions(automation.conditions as AutomationCondition[], event)) {
    status = "skipped";
  } else {
    for (const action of automation.actions as AutomationAction[]) {
      try {
        if (action.type === "notify") {
          const { data, error } = await supabase.from("notifications").insert({
            workspace_id: automation.workspace_id,
            user_id: automation.created_by,
            automation_id: automation.id,
            title: action.title,
            message: action.message,
          }).select("id").single();
          if (error) {
            status = "failed";
            errorMessage = error.message;
            break;
          }
          actionResults.push({ type: action.type, notificationId: data.id });
        } else {
          const { data, error } = await supabase.from("tasks").insert({
            workspace_id: automation.workspace_id,
            created_by: automation.created_by,
            title: action.title,
            priority: action.priority,
          }).select("id").single();
          if (error) {
            status = "failed";
            errorMessage = error.message;
            break;
          }
          actionResults.push({ type: action.type, taskId: data.id });
        }
      } catch (error) {
        status = "failed";
        errorMessage = error instanceof Error ? error.message : "Automation action failed.";
        break;
      }
    }
  }

  const finishedAt = new Date();
  const schedulePatch = options.advanceSchedule && automation.trigger_type === "schedule"
    ? automation.repeat_interval === "once"
      ? { enabled: false }
      : { next_run_at: getNextAutomationRun(startedAt, automation.repeat_interval || "once")?.toISOString() ?? automation.next_run_at }
    : {};

  const [runResult, updateResult] = await Promise.all([
    supabase.from("automation_runs").insert({
      workspace_id: automation.workspace_id,
      automation_id: automation.id,
      automation_name: automation.name,
      trigger_type: automation.trigger_type,
      status,
      trigger_data: event,
      action_results: actionResults,
      error_message: errorMessage,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
    }),
    supabase.from("automations").update({ last_run_at: finishedAt.toISOString(), ...schedulePatch }).eq("id", automation.id).eq("workspace_id", automation.workspace_id),
  ]);

  if (runResult.error) return { success: false, status, message: runResult.error.message, actionResults };
  if (updateResult.error) return { success: false, status, message: updateResult.error.message, actionResults };
  return { success: status !== "failed", status, message: errorMessage, actionResults };
}
