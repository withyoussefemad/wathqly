-- ==============================================================================
-- WATHQLY (وثّقلي) - Phase 1 Core OS Migration
-- Goals, Plans, Tasks, Projects, and Calendar Events with Workspace Isolation
-- ==============================================================================

-- 1. GOALS TABLE
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  timeframe TEXT NOT NULL DEFAULT 'quarter', -- vision, year, quarter, month, week, day
  status TEXT NOT NULL DEFAULT 'active',     -- active, completed, paused, archived
  priority TEXT NOT NULL DEFAULT 'medium',   -- low, medium, high, urgent
  target_value NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '%',
  start_date DATE,
  deadline DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_goals_workspace ON public.goals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON public.goals(parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_timeframe ON public.goals(timeframe);

-- 2. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress', -- planning, in_progress, on_hold, completed, archived
  priority TEXT NOT NULL DEFAULT 'medium',    -- low, medium, high, urgent
  color TEXT NOT NULL DEFAULT '#7C3AED',
  start_date DATE,
  target_date DATE,
  progress_percent INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_workspace_project_slug UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_goal ON public.projects(goal_id);

-- 3. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',       -- todo, in_progress, in_review, done, cancelled
  priority TEXT NOT NULL DEFAULT 'medium',   -- low, medium, high, urgent
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  estimated_minutes INT,
  actual_minutes INT,
  is_my_day BOOLEAN NOT NULL DEFAULT false,
  labels TEXT[] NOT NULL DEFAULT '{}',
  recurrence TEXT,                           -- daily, weekly, monthly, null
  order_index INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON public.tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_my_day ON public.tasks(is_my_day) WHERE is_my_day = true;

-- 4. PLANS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'daily',        -- daily, weekly, monthly, quarterly
  target_date DATE NOT NULL,
  objective TEXT,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'active',     -- draft, active, completed
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_plans_workspace_date ON public.plans(workspace_id, target_date);

-- 5. PLAN ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  time_block TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_plan_items_plan ON public.plan_items(plan_id);

-- 6. CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  event_type TEXT NOT NULL DEFAULT 'event',  -- event, task, meeting, milestone, focus
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_ws_time ON public.calendar_events(workspace_id, start_time);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR CORE OS
-- ==============================================================================

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Goals RLS
CREATE POLICY "Members can view workspace goals"
  ON public.goals FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace goals"
  ON public.goals FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace goals"
  ON public.goals FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace goals"
  ON public.goals FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Projects RLS
CREATE POLICY "Members can view workspace projects"
  ON public.projects FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace projects"
  ON public.projects FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace projects"
  ON public.projects FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace projects"
  ON public.projects FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Tasks RLS
CREATE POLICY "Members can view workspace tasks"
  ON public.tasks FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace tasks"
  ON public.tasks FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace tasks"
  ON public.tasks FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Plans & Plan Items RLS
CREATE POLICY "Members can view workspace plans"
  ON public.plans FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace plans"
  ON public.plans FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace plans"
  ON public.plans FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace plans"
  ON public.plans FOR DELETE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can view plan items"
  ON public.plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_items.plan_id
        AND is_workspace_member(p.workspace_id)
    )
  );

CREATE POLICY "Members can manage plan items"
  ON public.plan_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_items.plan_id
        AND is_workspace_member(p.workspace_id)
    )
  );

-- Calendar Events RLS
CREATE POLICY "Members can view workspace calendar events"
  ON public.calendar_events FOR SELECT
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workspace calendar events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update workspace calendar events"
  ON public.calendar_events FOR UPDATE
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workspace calendar events"
  ON public.calendar_events FOR DELETE
  USING (is_workspace_member(workspace_id));
