-- ==============================================================================
-- WATHQLY (وثّقلي) - Phase 2 Knowledge Migration
-- Folders, Tags, Notes, Backlinks, Files & Bookmarks with Workspace Isolation & RLS
-- ==============================================================================

-- 1. FOLDERS TABLE
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general', -- notes, files, bookmarks, general
  color TEXT NOT NULL DEFAULT '#7C3AED',
  icon TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_workspace_folder_slug UNIQUE (workspace_id, type, slug)
);

CREATE INDEX IF NOT EXISTS idx_folders_workspace ON public.folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_type ON public.folders(type);

-- 2. TAGS TABLE
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_workspace_tag_name UNIQUE (workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_workspace ON public.tags(workspace_id);

-- 3. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb, -- Tiptap JSON or structured prose
  content_html TEXT NOT NULL DEFAULT '',
  plain_text TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notes_workspace ON public.notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder ON public.notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON public.notes(project_id);
CREATE INDEX IF NOT EXISTS idx_notes_goal ON public.notes(goal_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON public.notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_notes_fts ON public.notes USING GIN (to_tsvector('english', title || ' ' || plain_text));

-- 4. NOTE TAGS TABLE (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.note_tags (
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON public.note_tags(tag_id);

-- 5. KNOWLEDGE BACKLINKS TABLE (Bidirectional Graph)
CREATE TABLE IF NOT EXISTS public.knowledge_backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  target_note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  target_entity_type TEXT NOT NULL DEFAULT 'note', -- note, project, goal, task, bookmark
  target_entity_id UUID,
  link_text TEXT,
  context_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_backlinks_workspace ON public.knowledge_backlinks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_source ON public.knowledge_backlinks(source_note_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_target_note ON public.knowledge_backlinks(target_note_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_target_entity ON public.knowledge_backlinks(target_entity_type, target_entity_id);

-- 6. FILES TABLE (Documents & Media)
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'document', -- pdf, image, video, audio, csv, document, archive, other
  labels TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_files_workspace ON public.files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON public.files(category);

-- 7. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  favicon_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  ai_summary TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_workspace ON public.bookmarks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON public.bookmarks(folder_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_domain ON public.bookmarks(domain);
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_favorite ON public.bookmarks(is_favorite) WHERE is_favorite = true;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR PHASE 2 KNOWLEDGE
-- ==============================================================================

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Folders RLS
CREATE POLICY "Members can view workspace folders"
  ON public.folders FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace folders"
  ON public.folders FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace folders"
  ON public.folders FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace folders"
  ON public.folders FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Tags RLS
CREATE POLICY "Members can view workspace tags"
  ON public.tags FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace tags"
  ON public.tags FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace tags"
  ON public.tags FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace tags"
  ON public.tags FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Notes RLS
CREATE POLICY "Members can view workspace notes"
  ON public.notes FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace notes"
  ON public.notes FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace notes"
  ON public.notes FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace notes"
  ON public.notes FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Note Tags RLS
CREATE POLICY "Members can view note tags"
  ON public.note_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notes n
      WHERE n.id = note_tags.note_id
        AND is_workspace_member(n.workspace_id)
    )
  );

CREATE POLICY "Members can manage note tags"
  ON public.note_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.notes n
      WHERE n.id = note_tags.note_id
        AND is_workspace_member(n.workspace_id)
    )
  );

-- Knowledge Backlinks RLS
CREATE POLICY "Members can view workspace backlinks"
  ON public.knowledge_backlinks FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace backlinks"
  ON public.knowledge_backlinks FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace backlinks"
  ON public.knowledge_backlinks FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace backlinks"
  ON public.knowledge_backlinks FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Files RLS
CREATE POLICY "Members can view workspace files"
  ON public.files FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace files"
  ON public.files FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace files"
  ON public.files FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace files"
  ON public.files FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Bookmarks RLS
CREATE POLICY "Members can view workspace bookmarks"
  ON public.bookmarks FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace bookmarks"
  ON public.bookmarks FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace bookmarks"
  ON public.bookmarks FOR DELETE
  USING (is_workspace_member(workspace_id));
