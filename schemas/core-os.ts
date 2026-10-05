import { z } from "zod";

// ==============================================================================
// Goals Schemas
// ==============================================================================
export const createGoalSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID").optional(),
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().min(2, "Goal title must be at least 2 characters").max(120),
  description: z.string().max(1000).optional(),
  timeframe: z.enum(["vision", "year", "quarter", "month", "week", "day"]).default("quarter"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  targetValue: z.number().min(1).default(100),
  currentValue: z.number().min(0).default(0),
  unit: z.string().default("%"),
  deadline: z.string().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

// ==============================================================================
// Projects Schemas
// ==============================================================================
export const createProjectSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID").optional(),
  goalId: z.string().uuid().nullable().optional(),
  name: z.string().min(2, "Project name must be at least 2 characters").max(100),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  color: z.string().default("#7C3AED"),
  targetDate: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ==============================================================================
// Tasks Schemas
// ==============================================================================
export const createTaskSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID").optional(),
  projectId: z.string().uuid().nullable().optional(),
  goalId: z.string().uuid().nullable().optional(),
  title: z.string().min(2, "Task title must be at least 2 characters").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().nullable().optional(),
  estimatedMinutes: z.number().min(5).max(1440).nullable().optional(),
  isMyDay: z.boolean().default(false),
  labels: z.array(z.string()).default([]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// ==============================================================================
// Plans Schemas
// ==============================================================================
export const createPlanSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID").optional(),
  type: z.enum(["daily", "weekly", "monthly", "quarterly"]).default("daily"),
  targetDate: z.string(),
  objective: z.string().min(2).max(300),
  summary: z.string().max(2000).optional(),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const addPlanItemSchema = z.object({
  planId: z.string().uuid(),
  taskId: z.string().uuid().nullable().optional(),
  title: z.string().min(2).max(200),
  timeBlock: z.string().max(50).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export type AddPlanItemInput = z.infer<typeof addPlanItemSchema>;

// ==============================================================================
// Calendar Event Schemas
// ==============================================================================
export const createCalendarEventSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID").optional(),
  title: z.string().min(2, "Event title must be at least 2 characters").max(150),
  description: z.string().max(1000).optional(),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean().default(false),
  eventType: z.enum(["event", "task", "meeting", "milestone", "focus"]).default("event"),
  taskId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  color: z.string().default("#7C3AED"),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
