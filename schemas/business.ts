import { z } from "zod";

const workspaceIdSchema = z.string().uuid();
const optionalUuidSchema = z.string().uuid().nullable().optional();
const optionalTextSchema = z.string().trim().max(1000).nullable().optional();

export const companyStatusSchema = z.enum(["lead", "customer", "partner"]);
export const companySizeSchema = z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]);
export const dealStageSchema = z.enum(["lead", "contacted", "qualified", "demo", "evaluation", "proposal", "won", "lost"]);
export const dealPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const activityTypeSchema = z.enum(["call", "email", "meeting", "task"]);
export const contentPlatformSchema = z.enum(["linkedin", "twitter", "blog", "youtube", "newsletter", "instagram", "tiktok"]);
export const contentStageSchema = z.enum(["idea", "draft", "review", "scheduled", "published"]);
export const campaignStatusSchema = z.enum(["draft", "active", "paused", "completed"]);

const participantSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  role: z.string().max(100).optional(),
});

export const createCompanySchema = z.object({
  workspaceId: workspaceIdSchema,
  name: z.string().min(1).max(255).trim(),
  domain: z.string().max(255).trim().optional().nullable(),
  industry: z.string().max(150).trim().optional().nullable(),
  size: companySizeSchema.optional().default("51-200"),
  status: companyStatusSchema.optional().default("lead"),
});

export const createContactSchema = z.object({
  workspaceId: workspaceIdSchema,
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email().max(255).trim().optional().nullable(),
  phone: z.string().max(30).trim().optional().nullable(),
  title: z.string().max(150).trim().optional().nullable(),
  companyId: optionalUuidSchema,
  status: z.enum(["lead", "active", "inactive"]).optional().default("lead"),
});

export const createDealSchema = z.object({
  workspaceId: workspaceIdSchema,
  title: z.string().min(1).max(255).trim(),
  value: z.number().nonnegative().default(0),
  stage: dealStageSchema.optional().default("lead"),
  companyId: optionalUuidSchema,
  contactId: optionalUuidSchema,
  priority: dealPrioritySchema.optional().default("medium"),
  description: optionalTextSchema,
});

export const updateDealStageSchema = z.object({
  stage: dealStageSchema,
});

export const createActivitySchema = z.object({
  workspaceId: workspaceIdSchema,
  title: z.string().min(1).max(255).trim(),
  type: activityTypeSchema,
  dealId: optionalUuidSchema,
  dueDate: z.string().datetime().optional().nullable(),
  completed: z.boolean().optional().default(false),
});

export const createMeetingSchema = z.object({
  workspaceId: workspaceIdSchema,
  title: z.string().min(1).max(255).trim(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(1440).default(30),
  location: z.string().max(500).trim().optional().nullable(),
  companyId: optionalUuidSchema,
  projectId: optionalUuidSchema,
  notes: optionalTextSchema,
  participants: z.array(participantSchema).default([]),
});

export const createContentItemSchema = z.object({
  workspaceId: workspaceIdSchema,
  title: z.string().min(1).max(255).trim(),
  platform: contentPlatformSchema,
  stage: contentStageSchema.optional().default("idea"),
  campaignId: optionalUuidSchema,
  projectId: optionalUuidSchema,
  scheduledDate: z.string().datetime().optional().nullable(),
  contentBody: z.string().max(100000).optional().default(""),
  excerpt: z.string().max(500).optional().default(""),
});

export const createCampaignSchema = z.object({
  workspaceId: workspaceIdSchema,
  name: z.string().min(1).max(255).trim(),
  description: optionalTextSchema,
  status: campaignStatusSchema.optional().default("active"),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export type CompanyStatus = z.infer<typeof companyStatusSchema>;
export type DealStage = z.infer<typeof dealStageSchema>;
export type ContentPlatform = z.infer<typeof contentPlatformSchema>;
export type ContentStage = z.infer<typeof contentStageSchema>;
export type MeetingParticipant = z.infer<typeof participantSchema>;
