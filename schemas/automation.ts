import { z } from "zod";

export const automationTriggerTypes = ["task_created", "task_completed", "deal_stage_changed", "schedule"] as const;
export const automationConditionFields = ["priority", "status", "stage", "title"] as const;
export const automationConditionOperators = ["equals", "not_equals", "contains"] as const;
export const automationRepeatIntervals = ["once", "daily", "weekly", "monthly"] as const;
export type AutomationRepeatInterval = typeof automationRepeatIntervals[number];

export const automationConditionSchema = z.object({
  field: z.enum(automationConditionFields),
  operator: z.enum(automationConditionOperators),
  value: z.string().trim().min(1).max(120),
});

export const automationActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("notify"), title: z.string().trim().min(2).max(120), message: z.string().trim().min(2).max(500) }),
  z.object({ type: z.literal("create_task"), title: z.string().trim().min(2).max(200), priority: z.enum(["low", "medium", "high", "urgent"]).default("medium") }),
]);

export const automationRuleSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  trigger_type: z.enum(automationTriggerTypes),
  conditions: z.array(automationConditionSchema).max(10).default([]),
  actions: z.array(automationActionSchema).min(1).max(5),
  repeat_interval: z.enum(automationRepeatIntervals).nullable().default(null),
  next_run_at: z.string().datetime().nullable().default(null),
}).superRefine((rule, context) => {
  if (rule.trigger_type === "schedule" && (!rule.repeat_interval || !rule.next_run_at)) {
    context.addIssue({ code: "custom", path: ["next_run_at"], message: "Scheduled workflows require a run time and repeat interval." });
  }
  if (rule.trigger_type !== "schedule" && (rule.repeat_interval || rule.next_run_at)) {
    context.addIssue({ code: "custom", path: ["repeat_interval"], message: "Only scheduled workflows can repeat." });
  }
});

export type AutomationCondition = z.infer<typeof automationConditionSchema>;
export type AutomationAction = z.infer<typeof automationActionSchema>;
export type AutomationRuleInput = z.infer<typeof automationRuleSchema>;
