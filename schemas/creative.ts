import { z } from "zod";

const uuidSchema = z.string().uuid();
const workspaceIdSchema = z.string().uuid();
const colorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Color must be a six-digit hex value");

export const createBoardSchema = z.object({
  id: z.string().uuid().optional().default(() => globalThis.crypto.randomUUID()),
  workspaceId: workspaceIdSchema,
  name: z.string().min(1).max(120).trim(),
  description: z.string().max(2000).trim().optional().default(""),
});

export const createNodeSchema = z.object({
  id: z.string().uuid().optional().default(() => globalThis.crypto.randomUUID()),
  workspaceId: workspaceIdSchema,
  boardId: uuidSchema,
  name: z.string().min(1).max(160).trim(),
  x: z.number().finite().min(-2000).max(20000),
  y: z.number().finite().min(-2000).max(20000),
  width: z.number().positive().max(2000),
  height: z.number().positive().max(1200),
  color: colorSchema.default("#7c3aed"),
  description: z.string().max(1000).trim().optional().default(""),
  kind: z.enum(["idea", "task", "project", "architecture", "note"]).optional().default("idea"),
});

export const createConnectorSchema = z.object({
  id: z.string().uuid().optional().default(() => globalThis.crypto.randomUUID()),
  workspaceId: workspaceIdSchema,
  boardId: uuidSchema,
  sourceNodeId: uuidSchema,
  targetNodeId: uuidSchema,
  color: colorSchema.default("#7c3aed"),
  label: z.string().max(160).trim().optional().default(""),
});

export const createTemplateSchema = z.object({
  workspaceId: workspaceIdSchema,
  name: z.string().min(1).max(120).trim(),
  kind: z.enum(["architecture", "mindmap", "roadmap", "workflow", "branded"]),
  nodes: z.array(createNodeSchema.omit({ workspaceId: true, boardId: true, id: true })).default([]),
  connectors: z.array(createConnectorSchema.omit({ workspaceId: true, boardId: true, id: true })).default([]),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type CreateConnectorInput = z.infer<typeof createConnectorSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
