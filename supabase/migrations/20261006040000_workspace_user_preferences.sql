CREATE TABLE IF NOT EXISTS public.workspace_user_preferences (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{"sidebarCollapsed":false,"mobileSidebarOpen":false}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT workspace_user_preferences_pkey PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_user_preferences_user ON public.workspace_user_preferences(user_id);

ALTER TABLE public.workspace_user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their workspace preferences"
  ON public.workspace_user_preferences FOR SELECT
  USING (user_id = auth.uid() AND is_workspace_member(workspace_id));

CREATE POLICY "Users can save their workspace preferences"
  ON public.workspace_user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id));

CREATE POLICY "Users can update their workspace preferences"
  ON public.workspace_user_preferences FOR UPDATE
  USING (user_id = auth.uid() AND is_workspace_member(workspace_id))
  WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id));
