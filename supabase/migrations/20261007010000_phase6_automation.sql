CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  description TEXT NOT NULL DEFAULT '',
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('task_created', 'task_completed', 'deal_stage_changed', 'schedule')),
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(conditions) = 'array'),
  actions JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(actions) = 'array' AND jsonb_array_length(actions) BETWEEN 1 AND 5),
  enabled BOOLEAN NOT NULL DEFAULT true,
  repeat_interval TEXT CHECK (repeat_interval IN ('once', 'daily', 'weekly', 'monthly')),
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT automations_schedule_fields_check CHECK (
    (trigger_type = 'schedule' AND repeat_interval IS NOT NULL AND next_run_at IS NOT NULL)
    OR (trigger_type <> 'schedule' AND repeat_interval IS NULL AND next_run_at IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES public.automations(id) ON DELETE SET NULL,
  automation_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  trigger_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES public.automations(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 2 AND 500),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_automations_due ON public.automations(next_run_at) WHERE enabled AND trigger_type = 'schedule';
CREATE INDEX IF NOT EXISTS idx_automations_workspace ON public.automations(workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_workspace ON public.automation_runs(workspace_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members manage automations" ON public.automations FOR ALL USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "Workspace members read automation history" ON public.automation_runs FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Workspace members insert automation history" ON public.automation_runs FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "Users read their workspace notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid() AND is_workspace_member(workspace_id));
CREATE POLICY "Workspace members create notifications" ON public.notifications FOR INSERT WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "Users update their workspace notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid() AND is_workspace_member(workspace_id)) WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id));