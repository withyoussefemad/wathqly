import { z } from "zod";

export const addWorkspaceMemberSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(["admin", "member", "viewer"]),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(""),
});

export const teamMemberSchema = z.object({ teamId: z.string().uuid(), userId: z.string().uuid() });
export const projectMemberSchema = z.object({ projectId: z.string().uuid(), userId: z.string().uuid() });
export const projectCommentSchema = z.object({ projectId: z.string().uuid(), body: z.string().trim().min(1).max(3000) });
export const approvalRequestSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(3000).default(""),
});
export const approvalDecisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1000).default(""),
});
