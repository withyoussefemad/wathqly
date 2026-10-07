"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/actions/workspace";
import {
  createFolderSchema,
  updateFolderSchema,
  createTagSchema,
  createNoteSchema,
  updateNoteSchema,
  createFileSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
  CreateFolderInput,
  UpdateFolderInput,
  CreateTagInput,
  CreateNoteInput,
  UpdateNoteInput,
  CreateFileInput,
  CreateBookmarkInput,
  UpdateBookmarkInput,
} from "@/schemas/knowledge";
import type {
  Folder,
  Tag,
  Note,
  KnowledgeBacklink,
  FileItem,
  Bookmark,
  FileCategory,
} from "@/lib/supabase/types";

// ==============================================================================
// IN-MEMORY SEEDS FOR OFFLINE / DEMO RESILIENCE
// ==============================================================================

const SEED_FOLDERS: Folder[] = [
  {
    id: "f-1",
    workspace_id: "demo-ws-1",
    parent_id: null,
    name: "Product & Architecture RFCs",
    slug: "product-architecture-rfcs",
    type: "notes",
    color: "#7C3AED",
    icon: "FolderGit2",
    order_index: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes_count: 3,
    files_count: 2,
    bookmarks_count: 1,
  },
  {
    id: "f-2",
    workspace_id: "demo-ws-1",
    parent_id: null,
    name: "CertiLayer Compliance Research",
    slug: "certilayer-compliance-research",
    type: "general",
    color: "#3B82F6",
    icon: "ShieldCheck",
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes_count: 2,
    files_count: 3,
    bookmarks_count: 3,
  },
  {
    id: "f-3",
    workspace_id: "demo-ws-1",
    parent_id: null,
    name: "Design & Brand Guidelines",
    slug: "design-brand-guidelines",
    type: "files",
    color: "#EC4899",
    icon: "Palette",
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes_count: 1,
    files_count: 4,
    bookmarks_count: 2,
  },
];

const SEED_TAGS: Tag[] = [
  { id: "t-1", workspace_id: "demo-ws-1", name: "Architecture", color: "#7C3AED", created_at: new Date().toISOString(), notes_count: 3 },
  { id: "t-2", workspace_id: "demo-ws-1", name: "Engineering", color: "#2563EB", created_at: new Date().toISOString(), notes_count: 2 },
  { id: "t-3", workspace_id: "demo-ws-1", name: "Compliance", color: "#059669", created_at: new Date().toISOString(), notes_count: 2 },
  { id: "t-4", workspace_id: "demo-ws-1", name: "AI", color: "#D97706", created_at: new Date().toISOString(), notes_count: 2 },
  { id: "t-5", workspace_id: "demo-ws-1", name: "CertiLayer", color: "#9333EA", created_at: new Date().toISOString(), notes_count: 4 },
];

const SEED_NOTES: Note[] = [
  {
    id: "n-1",
    workspace_id: "demo-ws-1",
    folder_id: "f-1",
    project_id: "p-1",
    goal_id: "g-1",
    task_id: null,
    title: "Modular Monolith Architecture Spec",
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Architectural Principles" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Wathqly is structured as a modular monolith. Avoid early microservices. Keep database isolation strict with workspace_id and row level security.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "See related design system in [[Design & Brand Guidelines]] and roadmap in [[Knowledge & Backlinks Graph Architecture]].",
            },
          ],
        },
      ],
    },
    content_html: "<h2>Architectural Principles</h2><p>Wathqly is structured as a modular monolith. Avoid early microservices. Keep database isolation strict with workspace_id and row level security.</p><p>See related design system in [[Design & Brand Guidelines]] and roadmap in [[Knowledge & Backlinks Graph Architecture]].</p>",
    plain_text: "Architectural Principles. Wathqly is structured as a modular monolith. Avoid early microservices. Keep database isolation strict with workspace_id and row level security. See related design system in [[Design & Brand Guidelines]] and roadmap in [[Knowledge & Backlinks Graph Architecture]].",
    is_pinned: true,
    is_archived: false,
    created_by: "demo-user",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    tags: [SEED_TAGS[0], SEED_TAGS[1]],
    backlinks_count: 2,
  },
  {
    id: "n-2",
    workspace_id: "demo-ws-1",
    folder_id: "f-1",
    project_id: "p-1",
    goal_id: "g-1",
    task_id: null,
    title: "Knowledge & Backlinks Graph Architecture",
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Phase 2 Knowledge Implementation" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "The knowledge graph connects Notes with Goals, Projects, Tasks, and Bookmarks. Bidirectional links are parsed via [[Modular Monolith Architecture Spec]] references.",
            },
          ],
        },
      ],
    },
    content_html: "<h2>Phase 2 Knowledge Implementation</h2><p>The knowledge graph connects Notes with Goals, Projects, Tasks, and Bookmarks. Bidirectional links are parsed via [[Modular Monolith Architecture Spec]] references.</p>",
    plain_text: "Phase 2 Knowledge Implementation. The knowledge graph connects Notes with Goals, Projects, Tasks, and Bookmarks. Bidirectional links are parsed via [[Modular Monolith Architecture Spec]] references.",
    is_pinned: true,
    is_archived: false,
    created_by: "demo-user",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    tags: [SEED_TAGS[0], SEED_TAGS[3]],
    backlinks_count: 1,
  },
  {
    id: "n-3",
    workspace_id: "demo-ws-1",
    folder_id: "f-2",
    project_id: "p-2",
    goal_id: "g-2",
    task_id: null,
    title: "CertiLayer Enterprise Compliance Requirements",
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Enterprise customers require SOC2 Type II, ISO 27001 mapping, automated audit trails, and strict tenant separation. Intersects with [[Modular Monolith Architecture Spec]].",
            },
          ],
        },
      ],
    },
    content_html: "<p>Enterprise customers require SOC2 Type II, ISO 27001 mapping, automated audit trails, and strict tenant separation. Intersects with [[Modular Monolith Architecture Spec]].</p>",
    plain_text: "Enterprise customers require SOC2 Type II, ISO 27001 mapping, automated audit trails, and strict tenant separation. Intersects with [[Modular Monolith Architecture Spec]].",
    is_pinned: false,
    is_archived: false,
    created_by: "demo-user",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    tags: [SEED_TAGS[2], SEED_TAGS[4]],
    backlinks_count: 1,
  },
];

const SEED_BACKLINKS: KnowledgeBacklink[] = [
  {
    id: "bl-1",
    workspace_id: "demo-ws-1",
    source_note_id: "n-2",
    target_note_id: "n-1",
    target_entity_type: "note",
    target_entity_id: "n-1",
    link_text: "Modular Monolith Architecture Spec",
    context_snippet: "...Bidirectional links are parsed via [[Modular Monolith Architecture Spec]] references...",
    created_at: new Date().toISOString(),
  },
  {
    id: "bl-2",
    workspace_id: "demo-ws-1",
    source_note_id: "n-3",
    target_note_id: "n-1",
    target_entity_type: "note",
    target_entity_id: "n-1",
    link_text: "Modular Monolith Architecture Spec",
    context_snippet: "...Intersects with [[Modular Monolith Architecture Spec]]...",
    created_at: new Date().toISOString(),
  },
  {
    id: "bl-3",
    workspace_id: "demo-ws-1",
    source_note_id: "n-1",
    target_note_id: "n-2",
    target_entity_type: "note",
    target_entity_id: "n-2",
    link_text: "Knowledge & Backlinks Graph Architecture",
    context_snippet: "...and roadmap in [[Knowledge & Backlinks Graph Architecture]]...",
    created_at: new Date().toISOString(),
  },
];

const SEED_FILES: FileItem[] = [
  {
    id: "fl-1",
    workspace_id: "demo-ws-1",
    folder_id: "f-1",
    project_id: "p-1",
    task_id: null,
    note_id: "n-1",
    name: "wathqly-architecture-diagram.pdf",
    file_path: "/storage/docs/wathqly-architecture-diagram.pdf",
    file_url: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop",
    file_type: "application/pdf",
    file_size: 2450000,
    category: "pdf",
    labels: ["architecture", "spec"],
    created_by: "demo-user",
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "fl-2",
    workspace_id: "demo-ws-1",
    folder_id: "f-3",
    project_id: null,
    task_id: null,
    note_id: null,
    name: "certilayer-brand-palette.png",
    file_path: "/storage/images/certilayer-brand-palette.png",
    file_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop",
    file_type: "image/png",
    file_size: 890000,
    category: "image",
    labels: ["design", "branding"],
    created_by: "demo-user",
    created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
  {
    id: "fl-3",
    workspace_id: "demo-ws-1",
    folder_id: "f-2",
    project_id: "p-2",
    task_id: null,
    note_id: "n-3",
    name: "enterprise-soc2-readiness-checklist.csv",
    file_path: "/storage/data/enterprise-soc2-readiness-checklist.csv",
    file_url: "https://raw.githubusercontent.com/datasets/sample.csv",
    file_type: "text/csv",
    file_size: 45000,
    category: "csv",
    labels: ["compliance", "audit"],
    created_by: "demo-user",
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
];

const SEED_BOOKMARKS: Bookmark[] = [
  {
    id: "bm-1",
    workspace_id: "demo-ws-1",
    folder_id: "f-1",
    project_id: "p-1",
    url: "https://tiptap.dev/docs/editor/introduction",
    title: "Tiptap Headless Editor Documentation & Extensions",
    description: "The headless editor framework for web artisans based on ProseMirror.",
    domain: "tiptap.dev",
    favicon_url: "https://tiptap.dev/favicon.ico",
    tags: ["editor", "tiptap", "react"],
    notes: "Essential reference for ProseMirror schema and slash-command extensions.",
    ai_summary: "Tiptap is an extensible ProseMirror-based headless text editor framework suited for complex collaborative notes, mentions, and custom schemas.",
    is_favorite: true,
    created_by: "demo-user",
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  {
    id: "bm-2",
    workspace_id: "demo-ws-1",
    folder_id: "f-2",
    project_id: "p-2",
    url: "https://certilayer.com/research/iso-27001-ai-governance",
    title: "ISO 27001 & SOC2 Compliance for Autonomous AI Agents",
    description: "Deep dive into continuous automated audit trails for autonomous systems in enterprise cloud environments.",
    domain: "certilayer.com",
    favicon_url: "https://certilayer.com/favicon.ico",
    tags: ["compliance", "ai", "security"],
    notes: "Directly referenced in our CertiLayer pipeline milestone.",
    ai_summary: "Outlines technical guardrails and tamper-evident audit logging necessary for deploying autonomous agents in regulated financial and healthcare sectors.",
    is_favorite: true,
    created_by: "demo-user",
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: "bm-3",
    workspace_id: "demo-ws-1",
    folder_id: "f-3",
    project_id: null,
    url: "https://github.com/shadcn-ui/ui",
    title: "shadcn/ui - Beautifully designed components that you can copy and paste",
    description: "Accessible and customizable components built with Radix UI and Tailwind CSS.",
    domain: "github.com",
    favicon_url: "https://github.githubassets.com/favicons/favicon.png",
    tags: ["design", "ui", "tailwind"],
    notes: "Design token references for modern theme palette.",
    ai_summary: "Standard React component library providing accessible building blocks for web applications.",
    is_favorite: false,
    created_by: "demo-user",
    created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 50).toISOString(),
  },
];

// Persistent runtime cache
let memoryFolders: Folder[] = [...SEED_FOLDERS];
const memoryTags: Tag[] = [...SEED_TAGS];
let memoryNotes: Note[] = [...SEED_NOTES];
let memoryBacklinks: KnowledgeBacklink[] = [...SEED_BACKLINKS];
let memoryFiles: FileItem[] = [...SEED_FILES];
let memoryBookmarks: Bookmark[] = [...SEED_BOOKMARKS];

async function resolveWorkspace(explicitId?: string): Promise<string> {
  if (explicitId) return explicitId;
  const ws = await getActiveWorkspace();
  return ws?.id || "demo-ws-1";
}

async function getSupabaseSafe() {
  try {
    const supabase = await createClient();
    const isConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
    );
    if (!isConfigured) return null;
    return supabase;
  } catch {
    return null;
  }
}

// ==============================================================================
// 1. FOLDERS ACTIONS
// ==============================================================================

export async function getFoldersAction(workspaceId?: string): Promise<Folder[]> {
  const wsId = await resolveWorkspace(workspaceId);
  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("workspace_id", wsId)
        .order("order_index", { ascending: true })
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // fallback
    }
  }
  return memoryFolders.filter((f) => f.workspace_id === wsId || f.workspace_id === "demo-ws-1");
}

export async function createFolderAction(input: CreateFolderInput, workspaceId?: string) {
  const parsed = createFolderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const wsId = await resolveWorkspace(workspaceId);
  const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const now = new Date().toISOString();

  const newFolder: Folder = {
    id: `f-${Date.now()}`,
    workspace_id: wsId,
    parent_id: parsed.data.parent_id || null,
    name: parsed.data.name,
    slug: slug || `folder-${Date.now()}`,
    type: parsed.data.type,
    color: parsed.data.color,
    icon: parsed.data.icon || null,
    order_index: parsed.data.order_index,
    created_at: now,
    updated_at: now,
    notes_count: 0,
    files_count: 0,
    bookmarks_count: 0,
  };

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("folders")
        .insert({
          workspace_id: wsId,
          parent_id: newFolder.parent_id,
          name: newFolder.name,
          slug: newFolder.slug,
          type: newFolder.type,
          color: newFolder.color,
          icon: newFolder.icon,
          order_index: newFolder.order_index,
        })
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/notes");
        revalidatePath("/knowledge");
        return { success: true, folder: data };
      }
    } catch {
      // fallback
    }
  }

  memoryFolders.unshift(newFolder);
  revalidatePath("/notes");
  revalidatePath("/knowledge");
  return { success: true, folder: newFolder };
}

export async function updateFolderAction(id: string, input: UpdateFolderInput) {
  const parsed = updateFolderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("folders")
        .update({
          ...parsed.data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/notes");
        revalidatePath("/knowledge");
        return { success: true, folder: data };
      }
    } catch {
      // fallback
    }
  }

  const idx = memoryFolders.findIndex((f) => f.id === id);
  if (idx !== -1) {
    memoryFolders[idx] = {
      ...memoryFolders[idx],
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };
    revalidatePath("/notes");
    revalidatePath("/knowledge");
    return { success: true, folder: memoryFolders[idx] };
  }

  return { success: false, error: "Folder not found" };
}

export async function deleteFolderAction(id: string) {
  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      await supabase.from("folders").delete().eq("id", id);
    } catch {
      // fallback
    }
  }
  memoryFolders = memoryFolders.filter((f) => f.id !== id);
  revalidatePath("/notes");
  revalidatePath("/knowledge");
  return { success: true };
}

// ==============================================================================
// 2. TAGS ACTIONS
// ==============================================================================

export async function getTagsAction(workspaceId?: string): Promise<Tag[]> {
  const wsId = await resolveWorkspace(workspaceId);
  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("workspace_id", wsId)
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // fallback
    }
  }
  return memoryTags.filter((t) => t.workspace_id === wsId || t.workspace_id === "demo-ws-1");
}

export async function createTagAction(input: CreateTagInput, workspaceId?: string) {
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const wsId = await resolveWorkspace(workspaceId);
  const now = new Date().toISOString();

  const newTag: Tag = {
    id: `t-${Date.now()}`,
    workspace_id: wsId,
    name: parsed.data.name,
    color: parsed.data.color,
    created_at: now,
    notes_count: 0,
  };

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({
          workspace_id: wsId,
          name: newTag.name,
          color: newTag.color,
        })
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/notes");
        return { success: true, tag: data };
      }
    } catch {
      // fallback
    }
  }

  memoryTags.push(newTag);
  revalidatePath("/notes");
  return { success: true, tag: newTag };
}

// ==============================================================================
// 3. BACKLINKS SYNC ENGINE
// ==============================================================================

export async function parseAndSyncNoteBacklinks(
  workspaceId: string,
  sourceNoteId: string,
  plainText: string,
  allNotes: Note[]
): Promise<KnowledgeBacklink[]> {
  const wikiLinkRegex = /\[\[(.*?)\]\]/g;
  const matches: string[] = [];
  let match;
  while ((match = wikiLinkRegex.exec(plainText)) !== null) {
    if (match[1]?.trim()) {
      matches.push(match[1].trim());
    }
  }

  const createdBacklinks: KnowledgeBacklink[] = [];

  memoryBacklinks = memoryBacklinks.filter((bl) => bl.source_note_id !== sourceNoteId);

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      await supabase.from("knowledge_backlinks").delete().eq("source_note_id", sourceNoteId);
    } catch {
      // fallback
    }
  }

  for (const targetTitle of matches) {
    const targetNote = allNotes.find(
      (n) => n.id !== sourceNoteId && n.title.toLowerCase() === targetTitle.toLowerCase()
    );

    if (targetNote) {
      const idx = plainText.indexOf(`[[${targetTitle}]]`);
      const start = Math.max(0, idx - 40);
      const end = Math.min(plainText.length, idx + targetTitle.length + 44);
      const snippet = (start > 0 ? "..." : "") + plainText.substring(start, end).trim() + (end < plainText.length ? "..." : "");

      const backlink: KnowledgeBacklink = {
        id: `bl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        workspace_id: workspaceId,
        source_note_id: sourceNoteId,
        target_note_id: targetNote.id,
        target_entity_type: "note",
        target_entity_id: targetNote.id,
        link_text: targetTitle,
        context_snippet: snippet,
        created_at: new Date().toISOString(),
      };

      memoryBacklinks.push(backlink);
      createdBacklinks.push(backlink);

      if (supabase) {
        try {
          await supabase.from("knowledge_backlinks").insert({
            workspace_id: workspaceId,
            source_note_id: sourceNoteId,
            target_note_id: targetNote.id,
            target_entity_type: "note",
            target_entity_id: targetNote.id,
            link_text: targetTitle,
            context_snippet: snippet,
          });
        } catch {
          // fallback
        }
      }
    }
  }

  return createdBacklinks;
}

export async function getBacklinksAction(noteId: string): Promise<KnowledgeBacklink[]> {
  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("knowledge_backlinks")
        .select("*, source_note:source_note_id(*)")
        .eq("target_note_id", noteId);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // fallback
    }
  }

  const incoming = memoryBacklinks.filter((bl) => bl.target_note_id === noteId);
  return incoming.map((bl) => ({
    ...bl,
    source_note: memoryNotes.find((n) => n.id === bl.source_note_id) || null,
  }));
}

// ==============================================================================
// 4. NOTES ACTIONS
// ==============================================================================

export async function getNotesAction(params?: {
  workspaceId?: string;
  folderId?: string;
  tag?: string;
  search?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}): Promise<Note[]> {
  const wsId = await resolveWorkspace(params?.workspaceId);
  let notes = memoryNotes.filter((n) => n.workspace_id === wsId || n.workspace_id === "demo-ws-1");

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      let query = supabase
        .from("notes")
        .select("*, folder:folder_id(*), project:project_id(*), goal:goal_id(*)")
        .eq("workspace_id", wsId)
        .order("updated_at", { ascending: false });

      if (params?.folderId) query = query.eq("folder_id", params.folderId);
      if (params?.isPinned !== undefined) query = query.eq("is_pinned", params.isPinned);
      if (params?.isArchived !== undefined) query = query.eq("is_archived", params.isArchived);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        notes = data;
      }
    } catch {
      // fallback
    }
  }

  if (params?.folderId) {
    notes = notes.filter((n) => n.folder_id === params.folderId);
  }
  if (params?.isPinned !== undefined) {
    notes = notes.filter((n) => n.is_pinned === params.isPinned);
  }
  if (params?.isArchived !== undefined) {
    notes = notes.filter((n) => n.is_archived === params.isArchived);
  } else {
    notes = notes.filter((n) => !n.is_archived);
  }

  if (params?.tag) {
    const tagLower = params.tag.toLowerCase();
    notes = notes.filter((n) => n.tags?.some((t) => t.name.toLowerCase() === tagLower));
  }

  if (params?.search) {
    const q = params.search.toLowerCase();
    notes = notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.plain_text.toLowerCase().includes(q)
    );
  }

  return notes.map((n) => ({
    ...n,
    folder: n.folder || memoryFolders.find((f) => f.id === n.folder_id) || null,
    backlinks_count: memoryBacklinks.filter((bl) => bl.target_note_id === n.id).length,
  }));
}

export async function getNoteByIdAction(id: string): Promise<Note | null> {
  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*, folder:folder_id(*), project:project_id(*), goal:goal_id(*)")
        .eq("id", id)
        .single();

      if (!error && data) {
        const backlinks = await getBacklinksAction(id);
        const note = data as unknown as Note;
        return {
          ...note,
          backlinks_count: backlinks.length,
        };
      }
    } catch {
      // fallback
    }
  }

  const note = memoryNotes.find((n) => n.id === id);
  if (!note) return null;

  return {
    ...note,
    folder: note.folder || memoryFolders.find((f) => f.id === note.folder_id) || null,
    backlinks_count: memoryBacklinks.filter((bl) => bl.target_note_id === note.id).length,
  };
}

export async function createNoteAction(input: CreateNoteInput, workspaceId?: string) {
  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const wsId = await resolveWorkspace(workspaceId);
  const now = new Date().toISOString();

  const assignedTags: Tag[] = (parsed.data.tags || []).map((tagName) => {
    const existing = memoryTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    if (existing) return existing;
    const newTag: Tag = {
      id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: wsId,
      name: tagName,
      color: "#6366F1",
      created_at: now,
    };
    memoryTags.push(newTag);
    return newTag;
  });

  const newNote: Note = {
    id: `n-${Date.now()}`,
    workspace_id: wsId,
    folder_id: parsed.data.folder_id || null,
    project_id: parsed.data.project_id || null,
    goal_id: parsed.data.goal_id || null,
    task_id: parsed.data.task_id || null,
    title: parsed.data.title,
    content: parsed.data.content || {},
    content_html: parsed.data.content_html || "",
    plain_text: parsed.data.plain_text || "",
    is_pinned: parsed.data.is_pinned ?? false,
    is_archived: parsed.data.is_archived ?? false,
    created_by: "current-user",
    created_at: now,
    updated_at: now,
    tags: assignedTags,
    backlinks_count: 0,
  };

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          workspace_id: wsId,
          folder_id: newNote.folder_id,
          project_id: newNote.project_id,
          goal_id: newNote.goal_id,
          task_id: newNote.task_id,
          title: newNote.title,
          content: newNote.content,
          content_html: newNote.content_html,
          plain_text: newNote.plain_text,
          is_pinned: newNote.is_pinned,
          is_archived: newNote.is_archived,
        })
        .select()
        .single();

      if (!error && data) {
        await parseAndSyncNoteBacklinks(wsId, data.id, newNote.plain_text, memoryNotes);
        revalidatePath("/notes");
        revalidatePath("/knowledge");
        return { success: true, note: data };
      }
    } catch {
      // fallback
    }
  }

  memoryNotes.unshift(newNote);
  await parseAndSyncNoteBacklinks(wsId, newNote.id, newNote.plain_text, memoryNotes);

  revalidatePath("/notes");
  revalidatePath("/knowledge");
  return { success: true, note: newNote };
}

export async function updateNoteAction(id: string, input: UpdateNoteInput) {
  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const now = new Date().toISOString();

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("notes")
        .update({
          ...parsed.data,
          updated_at: now,
        })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        if (parsed.data.plain_text !== undefined) {
          await parseAndSyncNoteBacklinks(data.workspace_id, id, parsed.data.plain_text, memoryNotes);
        }
        revalidatePath("/notes");
        revalidatePath("/knowledge");
        return { success: true, note: data };
      }
    } catch {
      // fallback
    }
  }

  const idx = memoryNotes.findIndex((n) => n.id === id);
  if (idx !== -1) {
    const existing = memoryNotes[idx];
    let updatedTags = existing.tags;
    if (parsed.data.tags) {
      updatedTags = parsed.data.tags.map((tagName) => {
        const existingTag = memoryTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
        if (existingTag) return existingTag;
        const newTag: Tag = {
          id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          workspace_id: existing.workspace_id,
          name: tagName,
          color: "#6366F1",
          created_at: now,
        };
        memoryTags.push(newTag);
        return newTag;
      });
    }

    const updated: Note = {
      ...existing,
      ...parsed.data,
      tags: updatedTags,
      updated_at: now,
    };
    memoryNotes[idx] = updated;

    if (parsed.data.plain_text !== undefined) {
      await parseAndSyncNoteBacklinks(existing.workspace_id, id, parsed.data.plain_text, memoryNotes);
    }

    revalidatePath("/notes");
    revalidatePath("/knowledge");
    return { success: true, note: updated };
  }

  return { success: false, error: "Note not found" };
}

export async function togglePinNoteAction(id: string) {
  const note = memoryNotes.find((n) => n.id === id);
  if (!note) return { success: false, error: "Note not found" };

  return updateNoteAction(id, { is_pinned: !note.is_pinned });
}

export async function toggleArchiveNoteAction(id: string) {
  const note = memoryNotes.find((n) => n.id === id);
  if (!note) return { success: false, error: "Note not found" };

  return updateNoteAction(id, { is_archived: !note.is_archived });
}

export async function deleteNoteAction(id: string) {
  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      await supabase.from("notes").delete().eq("id", id);
      await supabase.from("knowledge_backlinks").delete().eq("source_note_id", id);
      await supabase.from("knowledge_backlinks").delete().eq("target_note_id", id);
    } catch {
      // fallback
    }
  }

  memoryNotes = memoryNotes.filter((n) => n.id !== id);
  memoryBacklinks = memoryBacklinks.filter((bl) => bl.source_note_id !== id && bl.target_note_id !== id);

  revalidatePath("/notes");
  revalidatePath("/knowledge");
  return { success: true };
}

// ==============================================================================
// 5. FILES ACTIONS (Documents & Media)
// ==============================================================================

export async function getFilesAction(params?: {
  workspaceId?: string;
  folderId?: string;
  category?: string;
  search?: string;
}): Promise<FileItem[]> {
  const wsId = await resolveWorkspace(params?.workspaceId);
  let files = memoryFiles.filter((f) => f.workspace_id === wsId || f.workspace_id === "demo-ws-1");

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      let query = supabase
        .from("files")
        .select("*, folder:folder_id(*), project:project_id(*)")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false });

      if (params?.folderId) query = query.eq("folder_id", params.folderId);
      if (params?.category) query = query.eq("category", params.category as FileCategory);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        files = data;
      }
    } catch {
      // fallback
    }
  }

  if (params?.folderId) {
    files = files.filter((f) => f.folder_id === params.folderId);
  }
  if (params?.category && params.category !== "all") {
    files = files.filter((f) => f.category === params.category);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    files = files.filter(
      (f) => f.name.toLowerCase().includes(q) || f.labels.some((l) => l.toLowerCase().includes(q))
    );
  }

  return files.map((f) => ({
    ...f,
    folder: f.folder || memoryFolders.find((folder) => folder.id === f.folder_id) || null,
  }));
}

export async function createFileAction(input: CreateFileInput, workspaceId?: string) {
  const parsed = createFileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const wsId = await resolveWorkspace(workspaceId);
  const now = new Date().toISOString();

  const newFile: FileItem = {
    id: `fl-${Date.now()}`,
    workspace_id: wsId,
    folder_id: parsed.data.folder_id || null,
    project_id: parsed.data.project_id || null,
    task_id: parsed.data.task_id || null,
    note_id: parsed.data.note_id || null,
    name: parsed.data.name,
    file_path: parsed.data.file_path,
    file_url: parsed.data.file_url,
    file_type: parsed.data.file_type,
    file_size: parsed.data.file_size,
    category: parsed.data.category,
    labels: parsed.data.labels,
    created_by: "current-user",
    created_at: now,
    updated_at: now,
  };

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("files")
        .insert({
          workspace_id: wsId,
          folder_id: newFile.folder_id,
          project_id: newFile.project_id,
          task_id: newFile.task_id,
          note_id: newFile.note_id,
          name: newFile.name,
          file_path: newFile.file_path,
          file_url: newFile.file_url,
          file_type: newFile.file_type,
          file_size: newFile.file_size,
          category: newFile.category,
          labels: newFile.labels,
        })
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/knowledge");
        return { success: true, file: data };
      }
    } catch {
      // fallback
    }
  }

  memoryFiles.unshift(newFile);
  revalidatePath("/knowledge");
  return { success: true, file: newFile };
}

export async function deleteFileAction(id: string) {
  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      await supabase.from("files").delete().eq("id", id);
    } catch {
      // fallback
    }
  }

  memoryFiles = memoryFiles.filter((f) => f.id !== id);
  revalidatePath("/knowledge");
  return { success: true };
}

// ==============================================================================
// 6. BOOKMARKS ACTIONS
// ==============================================================================

export async function getBookmarksAction(params?: {
  workspaceId?: string;
  folderId?: string;
  tag?: string;
  search?: string;
  isFavorite?: boolean;
}): Promise<Bookmark[]> {
  const wsId = await resolveWorkspace(params?.workspaceId);
  let bookmarks = memoryBookmarks.filter((b) => b.workspace_id === wsId || b.workspace_id === "demo-ws-1");

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      let query = supabase
        .from("bookmarks")
        .select("*, folder:folder_id(*), project:project_id(*)")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false });

      if (params?.folderId) query = query.eq("folder_id", params.folderId);
      if (params?.isFavorite !== undefined) query = query.eq("is_favorite", params.isFavorite);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        bookmarks = data;
      }
    } catch {
      // fallback
    }
  }

  if (params?.folderId) {
    bookmarks = bookmarks.filter((b) => b.folder_id === params.folderId);
  }
  if (params?.isFavorite !== undefined) {
    bookmarks = bookmarks.filter((b) => b.is_favorite === params.isFavorite);
  }
  if (params?.tag) {
    const t = params.tag.toLowerCase();
    bookmarks = bookmarks.filter((b) => b.tags.some((tag) => tag.toLowerCase() === t));
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    bookmarks = bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.domain.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        b.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  return bookmarks.map((b) => ({
    ...b,
    folder: b.folder || memoryFolders.find((f) => f.id === b.folder_id) || null,
  }));
}

export async function createBookmarkAction(input: CreateBookmarkInput, workspaceId?: string) {
  const parsed = createBookmarkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const wsId = await resolveWorkspace(workspaceId);
  const now = new Date().toISOString();

  let domain = parsed.data.domain;
  if (!domain) {
    try {
      const urlObj = new URL(parsed.data.url);
      domain = urlObj.hostname.replace(/^www\./, "");
    } catch {
      domain = "web";
    }
  }

  const newBookmark: Bookmark = {
    id: `bm-${Date.now()}`,
    workspace_id: wsId,
    folder_id: parsed.data.folder_id || null,
    project_id: parsed.data.project_id || null,
    url: parsed.data.url,
    title: parsed.data.title,
    description: parsed.data.description || null,
    domain: domain || "web",
    favicon_url: parsed.data.favicon_url || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    tags: parsed.data.tags || [],
    notes: parsed.data.notes || null,
    ai_summary: parsed.data.ai_summary || null,
    is_favorite: parsed.data.is_favorite ?? false,
    created_by: "current-user",
    created_at: now,
    updated_at: now,
  };

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .insert({
          workspace_id: wsId,
          folder_id: newBookmark.folder_id,
          project_id: newBookmark.project_id,
          url: newBookmark.url,
          title: newBookmark.title,
          description: newBookmark.description,
          domain: newBookmark.domain,
          favicon_url: newBookmark.favicon_url,
          tags: newBookmark.tags,
          notes: newBookmark.notes,
          ai_summary: newBookmark.ai_summary,
          is_favorite: newBookmark.is_favorite,
        })
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/knowledge");
        return { success: true, bookmark: data };
      }
    } catch {
      // fallback
    }
  }

  memoryBookmarks.unshift(newBookmark);
  revalidatePath("/knowledge");
  return { success: true, bookmark: newBookmark };
}

export async function updateBookmarkAction(id: string, input: UpdateBookmarkInput) {
  const parsed = updateBookmarkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const now = new Date().toISOString();

  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .update({
          ...parsed.data,
          updated_at: now,
        })
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/knowledge");
        return { success: true, bookmark: data };
      }
    } catch {
      // fallback
    }
  }

  const idx = memoryBookmarks.findIndex((b) => b.id === id);
  if (idx !== -1) {
    const updated = {
      ...memoryBookmarks[idx],
      ...parsed.data,
      updated_at: now,
    };
    memoryBookmarks[idx] = updated;
    revalidatePath("/knowledge");
    return { success: true, bookmark: updated };
  }

  return { success: false, error: "Bookmark not found" };
}

export async function toggleFavoriteBookmarkAction(id: string) {
  const bookmark = memoryBookmarks.find((b) => b.id === id);
  if (!bookmark) return { success: false, error: "Bookmark not found" };

  return updateBookmarkAction(id, { is_favorite: !bookmark.is_favorite });
}

export async function deleteBookmarkAction(id: string) {
  const supabase = await getSupabaseSafe();
  if (supabase) {
    try {
      await supabase.from("bookmarks").delete().eq("id", id);
    } catch {
      // fallback
    }
  }

  memoryBookmarks = memoryBookmarks.filter((b) => b.id !== id);
  revalidatePath("/knowledge");
  return { success: true };
}

export async function summarizeBookmarkWithAIAction(id: string) {
  const bookmark = memoryBookmarks.find((b) => b.id === id);
  if (!bookmark) return { success: false, error: "Bookmark not found" };

  const aiSummary = `AI Synthesis for ${bookmark.title} (${bookmark.domain}): Key reference covering ${
    bookmark.tags.join(", ") || "core system capabilities"
  }. Highlights best practices for connected data models, secure enterprise implementation, and structured documentation workflows.`;

  return updateBookmarkAction(id, { ai_summary: aiSummary });
}

// ==============================================================================
// 7. OMNI KNOWLEDGE SEARCH
// ==============================================================================

export interface KnowledgeSearchResults {
  query: string;
  notes: Note[];
  files: FileItem[];
  bookmarks: Bookmark[];
  totalCount: number;
}

export async function searchKnowledgeAction(
  query: string,
  type: "all" | "notes" | "files" | "bookmarks" = "all",
  workspaceId?: string
): Promise<KnowledgeSearchResults> {
  const q = query.trim().toLowerCase();
  const wsId = await resolveWorkspace(workspaceId);

  let notes: Note[] = [];
  let files: FileItem[] = [];
  let bookmarks: Bookmark[] = [];

  if (type === "all" || type === "notes") {
    notes = await getNotesAction({ workspaceId: wsId, search: q });
  }

  if (type === "all" || type === "files") {
    files = await getFilesAction({ workspaceId: wsId, search: q });
  }

  if (type === "all" || type === "bookmarks") {
    bookmarks = await getBookmarksAction({ workspaceId: wsId, search: q });
  }

  return {
    query,
    notes,
    files,
    bookmarks,
    totalCount: notes.length + files.length + bookmarks.length,
  };
}
