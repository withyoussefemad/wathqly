import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters").max(50, "Workspace name is too long"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and dashes")
    .optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const switchWorkspaceSchema = z.object({
  workspaceId: z.string().uuid("Invalid workspace ID"),
});

export type SwitchWorkspaceInput = z.infer<typeof switchWorkspaceSchema>;
