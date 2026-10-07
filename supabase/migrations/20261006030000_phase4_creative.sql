-- ==============================================================================
-- WATHQLY Phase 4 Creative Migration
-- Workspace-scoped whiteboards, graph nodes, connectors, and reusable templates
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.creative_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.creative_boards
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.creative_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.creative_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'idea',
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC NOT NULL DEFAULT 220,
  height NUMERIC NOT NULL DEFAULT 96,
  color TEXT NOT NULL DEFAULT '#7c3aed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT creative_nodes_kind_check CHECK (kind IN ('idea', 'task', 'project', 'architecture', 'note')),
  CONSTRAINT creative_nodes_coordinates_check CHECK (x >= 0 AND y >= 0 AND width > 0 AND height > 0)
);

CREATE TABLE IF NOT EXISTS public.creative_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES public.creative_boards(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.creative_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.creative_nodes(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#7c3aed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT creative_connectors_distinct_endpoints CHECK (source_node_id <> target_node_id)
);

CREATE TABLE IF NOT EXISTS public.creative_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  connectors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT creative_templates_kind_check CHECK (kind IN ('architecture', 'mindmap', 'roadmap', 'workflow', 'branded'))
);

CREATE INDEX IF NOT EXISTS idx_creative_boards_workspace ON public.creative_boards(workspace_id);
CREATE INDEX IF NOT EXISTS idx_creative_nodes_board ON public.creative_nodes(board_id);
CREATE INDEX IF NOT EXISTS idx_creative_connectors_board ON public.creative_connectors(board_id);
CREATE INDEX IF NOT EXISTS idx_creative_templates_workspace ON public.creative_templates(workspace_id);

ALTER TABLE public.creative_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage creative boards"
  ON public.creative_boards FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "Members can manage creative nodes"
  ON public.creative_nodes FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "Members can manage creative connectors"
  ON public.creative_connectors FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "Members can manage creative templates"
  ON public.creative_templates FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
