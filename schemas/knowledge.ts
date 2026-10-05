import { z } from "zod";

export const folderTypeSchema = z.enum(["notes", "files", "bookmarks", "general"]);

export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100),
  type: folderTypeSchema.default("general"),
  parent_id: z.string().nullable().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid color format").default("#7C3AED"),
  icon: z.string().max(50).nullable().optional(),
  order_index: z.number().int().default(0),
});

export const updateFolderSchema = createFolderSchema.partial();

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50).trim(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid color format").default("#6366F1"),
});

export const createNoteSchema = z.object({
  title: z.string().min(1, "Note title is required").max(255).trim(),
  content: z.record(z.string(), z.unknown()).optional().default({}),
  content_html: z.string().optional().default(""),
  plain_text: z.string().optional().default(""),
  folder_id: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  goal_id: z.string().nullable().optional(),
  task_id: z.string().nullable().optional(),
  tags: z.array(z.string()).optional().default([]),
  is_pinned: z.boolean().default(false),
  is_archived: z.boolean().default(false),
});

export const updateNoteSchema = createNoteSchema.partial();

export const fileCategorySchema = z.enum([
  "pdf",
  "image",
  "video",
  "audio",
  "csv",
  "document",
  "archive",
  "other",
]);

export const createFileSchema = z.object({
  name: z.string().min(1, "File name is required").max(255),
  file_path: z.string().min(1, "File path is required"),
  file_url: z.string().min(1, "File URL is required"),
  file_type: z.string().default("application/octet-stream"),
  file_size: z.number().nonnegative().default(0),
  category: fileCategorySchema.default("document"),
  folder_id: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  task_id: z.string().nullable().optional(),
  note_id: z.string().nullable().optional(),
  labels: z.array(z.string()).default([]),
});

export const updateFileSchema = createFileSchema.partial();

export const createBookmarkSchema = z.object({
  url: z.string().url("A valid URL is required"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).nullable().optional(),
  domain: z.string().optional(),
  favicon_url: z.string().url().nullable().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  ai_summary: z.string().nullable().optional(),
  folder_id: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  is_favorite: z.boolean().default(false),
});

export const updateBookmarkSchema = createBookmarkSchema.partial();

export const knowledgeSearchSchema = z.object({
  query: z.string().default(""),
  type: z.enum(["all", "notes", "files", "bookmarks"]).default("all"),
  folder_id: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
});

export type CreateFolderInput = z.input<typeof createFolderSchema>;
export type UpdateFolderInput = z.input<typeof updateFolderSchema>;
export type CreateTagInput = z.input<typeof createTagSchema>;
export type CreateNoteInput = z.input<typeof createNoteSchema>;
export type UpdateNoteInput = z.input<typeof updateNoteSchema>;
export type CreateFileInput = z.input<typeof createFileSchema>;
export type UpdateFileInput = z.input<typeof updateFileSchema>;
export type CreateBookmarkInput = z.input<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.input<typeof updateBookmarkSchema>;
export type KnowledgeSearchInput = z.input<typeof knowledgeSearchSchema>;
