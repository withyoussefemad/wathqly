import { z } from "zod";

const uuidSchema = z.string().uuid();
const planningPeriods = z.enum(["daily", "weekly", "monthly", "quarterly"]);
const priorities = z.enum(["low", "medium", "high", "urgent"]);
const actionNames = z.enum(["create_plan", "create_review", "create_note", "update_task", "get_memory"]);

export const aiActionSchema = z.object({
  action: actionNames,
  arguments: z.record(z.string(), z.unknown()),
});

export const aiPlanSchema = z.object({
  period: planningPeriods,
  objective: z.string().min(1).max(500),
  summary: z.string().min(1).max(4000),
  items: z.array(z.object({
    title: z.string().min(1).max(160),
    timeBlock: z.string().max(80).optional(),
    priority: priorities,
  })).min(1).max(50),
});

export const aiReviewSchema = z.object({
  entityType: z.enum(["project", "goal", "task", "note", "meeting"]),
  entityId: uuidSchema,
  summary: z.string().min(1).max(2000),
  findings: z.array(z.object({
    severity: z.enum(["info", "warning", "critical"]),
    message: z.string().min(1).max(1000),
  })).min(1).max(50),
});

export const aiMemorySchema = z.object({
  key: z.string().min(1).max(160),
  value: z.string().min(1).max(4000),
  source: z.string().min(1).max(160),
  scope: z.enum(["user", "workspace", "project", "business", "knowledge"]),
  privacy: z.enum(["private", "workspace", "public"]),
  confidence: z.number().min(0).max(1),
});

export function normalizeToolCall(input: { name: string; args?: unknown }): z.infer<typeof aiActionSchema> {
  const parsed = aiActionSchema.safeParse({
    action: input.name,
    arguments: input.args && typeof input.args === "object" ? input.args as Record<string, unknown> : {},
  });
  if (!parsed.success) {
    throw new Error(`Unsupported AI tool: ${input.name}`);
  }
  return parsed.data;
}
