-- =============================================================================
-- Wathqly - Consolidated Supabase Setup (single file, idempotent)
-- =============================================================================
-- HOW TO RUN:
--   Supabase Dashboard -> SQL Editor -> New query -> paste this entire file -> Run.
--   Safe to run multiple times, and safe on a fresh project.
--
-- WHAT THIS FIXES (diagnosed against the live database on 2026-10-06):
--   1. ALL 32 existing tables returned "permission denied" (42501) even to the
--      service_role key. The migration files contain no GRANT statements and the
--      default Supabase grants were lost (an `rls_auto_enable` function exists
--      in the live DB that no migration created = manual SQL surgery).
--      Block 1 below restores the default grants + default privileges.
--   2. The `workspace_user_preferences` table (migration 20261006040000) was
--      never applied to the live DB. It is included below.
--   3. Migrations phase0-phase5 ARE applied on the live DB, so the replay block
--      is a no-op there, but it makes this file self-sufficient on a new project.
--
-- ORDER: extensions -> enum -> functions -> tables (phase0..phase5, FK-safe)
--        -> indexes -> RLS -> policies (auto-guarded with DROP IF EXISTS)
--        -> grants (re-asserted last so nothing can revoke them afterwards).
-- =============================================================================

-- =============================================================================
-- BLOCK 1 - RESTORE DEFAULT GRANTS (the actual breakage on the live database)
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- =============================================================================
-- BLOCK 2 - FULL IDEMPOTENT REPLAY OF ALL 7 MIGRATIONS
--             (no-op on the live DB; required on a fresh project)
-- =============================================================================
-- ====== SOURCE MIGRATION: 20261005000000_phase0_foundation.sql ======
-- ==============================================================================
-- WATHQLY (وثّقلي) - Phase 0 Foundation Migration
-- Workspace Isolation, User Profiles, Membership Roles, and Audit Logs
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS & ROLES
DO $$ BEGIN
  CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. USERS / PROFILES TABLE
-- Extends Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON public.workspaces(created_by);

-- 4. WORKSPACE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ws ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- SECURITY HELPER FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================

-- Check if current authenticated user is a member of the given workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
      AND user_id = auth.uid()
  );
$$;

-- Check if current authenticated user is an owner or admin of the given workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
  );
$$;

-- Return all workspace IDs current user has access to
CREATE OR REPLACE FUNCTION public.get_current_user_workspaces()
RETURNS TABLE(workspace_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT workspace_id 
  FROM public.workspace_members 
  WHERE user_id = auth.uid();
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view profiles of people in their shared workspaces, or their own
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Workspaces: Members can view workspaces they belong to
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
CREATE POLICY "Members can view workspaces" ON public.workspaces FOR SELECT
  USING (
    id IN (SELECT get_current_user_workspaces())
  );

DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
CREATE POLICY "Authenticated users can create workspaces" ON public.workspaces FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Owners and admins can update workspaces" ON public.workspaces;
CREATE POLICY "Owners and admins can update workspaces" ON public.workspaces FOR UPDATE
  USING (
    is_workspace_admin_or_owner(id)
  );

DROP POLICY IF EXISTS "Only workspace owner can delete workspace" ON public.workspaces;
CREATE POLICY "Only workspace owner can delete workspace" ON public.workspaces FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Workspace Members: Members can view all members in their workspaces
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
CREATE POLICY "Members can view workspace members" ON public.workspace_members FOR SELECT
  USING (
    is_workspace_member(workspace_id)
  );

DROP POLICY IF EXISTS "Owners/admins can add or manage members" ON public.workspace_members;
CREATE POLICY "Owners/admins can add or manage members" ON public.workspace_members FOR INSERT
  WITH CHECK (
    is_workspace_admin_or_owner(workspace_id) OR
    -- Allow initial owner insertion during workspace creation
    (user_id = auth.uid() AND role = 'owner')
  );

DROP POLICY IF EXISTS "Owners/admins can update members" ON public.workspace_members;
CREATE POLICY "Owners/admins can update members" ON public.workspace_members FOR UPDATE
  USING (
    is_workspace_admin_or_owner(workspace_id)
  );

DROP POLICY IF EXISTS "Owners/admins can remove members" ON public.workspace_members;
CREATE POLICY "Owners/admins can remove members" ON public.workspace_members FOR DELETE
  USING (
    is_workspace_admin_or_owner(workspace_id) OR user_id = auth.uid()
  );

-- Audit Logs: Viewable only by workspace members
DROP POLICY IF EXISTS "Members can view workspace audit logs" ON public.audit_logs;
CREATE POLICY "Members can view workspace audit logs" ON public.audit_logs FOR SELECT
  USING (
    is_workspace_member(workspace_id)
  );

DROP POLICY IF EXISTS "System can record audit logs" ON public.audit_logs;
CREATE POLICY "System can record audit logs" ON public.audit_logs FOR INSERT
  WITH CHECK (
    is_workspace_member(workspace_id)
  );

-- ==============================================================================
-- AUTOMATED USER CREATION TRIGGER
-- When a user signs up in auth.users, create their profile & initial personal workspace
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
  v_user_name TEXT;
  v_slug TEXT;
BEGIN
  -- Determine name or fallback
  v_user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  -- Create Profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    v_user_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create Default Workspace ("Personal")
  v_slug := lower(regexp_replace(v_user_name, '[^a-zA-Z0-9]', '', 'g')) || '-' || substr(NEW.id::text, 1, 8);
  
  INSERT INTO public.workspaces (name, slug, created_by)
  VALUES ('Personal', v_slug, NEW.id)
  RETURNING id INTO v_workspace_id;

  -- Add user as workspace Owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, NEW.id, 'owner');

  -- Log audit
  INSERT INTO public.audit_logs (workspace_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_workspace_id,
    NEW.id,
    'workspace_created',
    'workspace',
    v_workspace_id::text,
    jsonb_build_object('name', 'Personal', 'is_default', true)
  );

  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====== SOURCE MIGRATION: 20261006000000_phase1_core_os.sql ======
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
DROP POLICY IF EXISTS "Members can view workspace goals" ON public.goals;
CREATE POLICY "Members can view workspace goals" ON public.goals FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace goals" ON public.goals;
CREATE POLICY "Members can insert workspace goals" ON public.goals FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace goals" ON public.goals;
CREATE POLICY "Members can update workspace goals" ON public.goals FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace goals" ON public.goals;
CREATE POLICY "Members can delete workspace goals" ON public.goals FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Projects RLS
DROP POLICY IF EXISTS "Members can view workspace projects" ON public.projects;
CREATE POLICY "Members can view workspace projects" ON public.projects FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace projects" ON public.projects;
CREATE POLICY "Members can insert workspace projects" ON public.projects FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace projects" ON public.projects;
CREATE POLICY "Members can update workspace projects" ON public.projects FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace projects" ON public.projects;
CREATE POLICY "Members can delete workspace projects" ON public.projects FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Tasks RLS
DROP POLICY IF EXISTS "Members can view workspace tasks" ON public.tasks;
CREATE POLICY "Members can view workspace tasks" ON public.tasks FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace tasks" ON public.tasks;
CREATE POLICY "Members can insert workspace tasks" ON public.tasks FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace tasks" ON public.tasks;
CREATE POLICY "Members can update workspace tasks" ON public.tasks FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace tasks" ON public.tasks;
CREATE POLICY "Members can delete workspace tasks" ON public.tasks FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Plans & Plan Items RLS
DROP POLICY IF EXISTS "Members can view workspace plans" ON public.plans;
CREATE POLICY "Members can view workspace plans" ON public.plans FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace plans" ON public.plans;
CREATE POLICY "Members can insert workspace plans" ON public.plans FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace plans" ON public.plans;
CREATE POLICY "Members can update workspace plans" ON public.plans FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace plans" ON public.plans;
CREATE POLICY "Members can delete workspace plans" ON public.plans FOR DELETE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can view plan items" ON public.plan_items;
CREATE POLICY "Members can view plan items" ON public.plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_items.plan_id
        AND is_workspace_member(p.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Members can manage plan items" ON public.plan_items;
CREATE POLICY "Members can manage plan items" ON public.plan_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_items.plan_id
        AND is_workspace_member(p.workspace_id)
    )
  );

-- Calendar Events RLS
DROP POLICY IF EXISTS "Members can view workspace calendar events" ON public.calendar_events;
CREATE POLICY "Members can view workspace calendar events" ON public.calendar_events FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace calendar events" ON public.calendar_events;
CREATE POLICY "Members can insert workspace calendar events" ON public.calendar_events FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace calendar events" ON public.calendar_events;
CREATE POLICY "Members can update workspace calendar events" ON public.calendar_events FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace calendar events" ON public.calendar_events;
CREATE POLICY "Members can delete workspace calendar events" ON public.calendar_events FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ====== SOURCE MIGRATION: 20261006010000_phase2_knowledge.sql ======
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
DROP POLICY IF EXISTS "Members can view workspace folders" ON public.folders;
CREATE POLICY "Members can view workspace folders" ON public.folders FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace folders" ON public.folders;
CREATE POLICY "Members can insert workspace folders" ON public.folders FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace folders" ON public.folders;
CREATE POLICY "Members can update workspace folders" ON public.folders FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace folders" ON public.folders;
CREATE POLICY "Members can delete workspace folders" ON public.folders FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Tags RLS
DROP POLICY IF EXISTS "Members can view workspace tags" ON public.tags;
CREATE POLICY "Members can view workspace tags" ON public.tags FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace tags" ON public.tags;
CREATE POLICY "Members can insert workspace tags" ON public.tags FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace tags" ON public.tags;
CREATE POLICY "Members can update workspace tags" ON public.tags FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace tags" ON public.tags;
CREATE POLICY "Members can delete workspace tags" ON public.tags FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Notes RLS
DROP POLICY IF EXISTS "Members can view workspace notes" ON public.notes;
CREATE POLICY "Members can view workspace notes" ON public.notes FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace notes" ON public.notes;
CREATE POLICY "Members can insert workspace notes" ON public.notes FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace notes" ON public.notes;
CREATE POLICY "Members can update workspace notes" ON public.notes FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace notes" ON public.notes;
CREATE POLICY "Members can delete workspace notes" ON public.notes FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Note Tags RLS
DROP POLICY IF EXISTS "Members can view note tags" ON public.note_tags;
CREATE POLICY "Members can view note tags" ON public.note_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notes n
      WHERE n.id = note_tags.note_id
        AND is_workspace_member(n.workspace_id)
    )
  );

DROP POLICY IF EXISTS "Members can manage note tags" ON public.note_tags;
CREATE POLICY "Members can manage note tags" ON public.note_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.notes n
      WHERE n.id = note_tags.note_id
        AND is_workspace_member(n.workspace_id)
    )
  );

-- Knowledge Backlinks RLS
DROP POLICY IF EXISTS "Members can view workspace backlinks" ON public.knowledge_backlinks;
CREATE POLICY "Members can view workspace backlinks" ON public.knowledge_backlinks FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace backlinks" ON public.knowledge_backlinks;
CREATE POLICY "Members can insert workspace backlinks" ON public.knowledge_backlinks FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace backlinks" ON public.knowledge_backlinks;
CREATE POLICY "Members can update workspace backlinks" ON public.knowledge_backlinks FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace backlinks" ON public.knowledge_backlinks;
CREATE POLICY "Members can delete workspace backlinks" ON public.knowledge_backlinks FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Files RLS
DROP POLICY IF EXISTS "Members can view workspace files" ON public.files;
CREATE POLICY "Members can view workspace files" ON public.files FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace files" ON public.files;
CREATE POLICY "Members can insert workspace files" ON public.files FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace files" ON public.files;
CREATE POLICY "Members can update workspace files" ON public.files FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace files" ON public.files;
CREATE POLICY "Members can delete workspace files" ON public.files FOR DELETE
  USING (is_workspace_member(workspace_id));

-- Bookmarks RLS
DROP POLICY IF EXISTS "Members can view workspace bookmarks" ON public.bookmarks;
CREATE POLICY "Members can view workspace bookmarks" ON public.bookmarks FOR SELECT
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert workspace bookmarks" ON public.bookmarks;
CREATE POLICY "Members can insert workspace bookmarks" ON public.bookmarks FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update workspace bookmarks" ON public.bookmarks;
CREATE POLICY "Members can update workspace bookmarks" ON public.bookmarks FOR UPDATE
  USING (is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete workspace bookmarks" ON public.bookmarks;
CREATE POLICY "Members can delete workspace bookmarks" ON public.bookmarks FOR DELETE
  USING (is_workspace_member(workspace_id));

-- ====== SOURCE MIGRATION: 20261006020000_phase3_business.sql ======
-- ==============================================================================
-- WATHQLY Phase 3 Business Migration
-- CRM, meetings, content, campaigns, and workspace-scoped workflows
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT NOT NULL DEFAULT '51-200',
  status TEXT NOT NULL DEFAULT 'lead',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT companies_size_check CHECK (size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  CONSTRAINT companies_status_check CHECK (status IN ('lead', 'customer', 'partner'))
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  title TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'lead',
  linkedin_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT contacts_status_check CHECK (status IN ('lead', 'active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'lead',
  priority TEXT NOT NULL DEFAULT 'medium',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT deals_stage_check CHECK (stage IN ('lead', 'contacted', 'qualified', 'demo', 'evaluation', 'proposal', 'won', 'lost')),
  CONSTRAINT deals_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT deals_status_check CHECK (status IN ('open', 'won', 'lost'))
);

CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT crm_activities_type_check CHECK (type IN ('call', 'email', 'meeting', 'task'))
);

CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  location TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  notes TEXT,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  follow_ups JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT meetings_status_check CHECK (status IN ('scheduled', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.content_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT content_campaigns_status_check CHECK (status IN ('draft', 'active', 'paused', 'completed'))
);

CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'idea',
  campaign_id UUID REFERENCES public.content_campaigns(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  scheduled_date TIMESTAMPTZ,
  content_body TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT content_items_platform_check CHECK (platform IN ('linkedin', 'twitter', 'blog', 'youtube', 'newsletter', 'instagram', 'tiktok')),
  CONSTRAINT content_items_stage_check CHECK (stage IN ('idea', 'draft', 'review', 'scheduled', 'published'))
);

CREATE INDEX IF NOT EXISTS idx_companies_workspace ON public.companies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_company ON public.contacts(workspace_id, company_id);
CREATE INDEX IF NOT EXISTS idx_deals_workspace_stage ON public.deals(workspace_id, stage);
CREATE INDEX IF NOT EXISTS idx_crm_activities_workspace_due ON public.crm_activities(workspace_id, due_date);
CREATE INDEX IF NOT EXISTS idx_meetings_workspace_scheduled ON public.meetings(workspace_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_campaigns_workspace ON public.content_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_items_workspace_stage ON public.content_items(workspace_id, stage);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can manage companies" ON public.companies;
CREATE POLICY "Members can manage companies" ON public.companies FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members can manage contacts" ON public.contacts;
CREATE POLICY "Members can manage contacts" ON public.contacts FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members can manage deals" ON public.deals;
CREATE POLICY "Members can manage deals" ON public.deals FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members can manage CRM activities" ON public.crm_activities;
CREATE POLICY "Members can manage CRM activities" ON public.crm_activities FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members can manage meetings" ON public.meetings;
CREATE POLICY "Members can manage meetings" ON public.meetings FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members can manage content campaigns" ON public.content_campaigns;
CREATE POLICY "Members can manage content campaigns" ON public.content_campaigns FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members can manage content items" ON public.content_items;
CREATE POLICY "Members can manage content items" ON public.content_items FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- ====== SOURCE MIGRATION: 20261006030000_phase4_creative.sql ======
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

DROP POLICY IF EXISTS "Members can manage creative boards" ON public.creative_boards;
CREATE POLICY "Members can manage creative boards" ON public.creative_boards FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members can manage creative nodes" ON public.creative_nodes;
CREATE POLICY "Members can manage creative nodes" ON public.creative_nodes FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members can manage creative connectors" ON public.creative_connectors;
CREATE POLICY "Members can manage creative connectors" ON public.creative_connectors FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "Members can manage creative templates" ON public.creative_templates;
CREATE POLICY "Members can manage creative templates" ON public.creative_templates FOR ALL
  USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- ====== SOURCE MIGRATION: 20261006040000_workspace_user_preferences.sql ======
CREATE TABLE IF NOT EXISTS public.workspace_user_preferences (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{"sidebarCollapsed":false,"mobileSidebarOpen":false}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT workspace_user_preferences_pkey PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_user_preferences_user ON public.workspace_user_preferences(user_id);

ALTER TABLE public.workspace_user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their workspace preferences" ON public.workspace_user_preferences;
CREATE POLICY "Users can read their workspace preferences" ON public.workspace_user_preferences FOR SELECT
  USING (user_id = auth.uid() AND is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can save their workspace preferences" ON public.workspace_user_preferences;
CREATE POLICY "Users can save their workspace preferences" ON public.workspace_user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Users can update their workspace preferences" ON public.workspace_user_preferences;
CREATE POLICY "Users can update their workspace preferences" ON public.workspace_user_preferences FOR UPDATE
  USING (user_id = auth.uid() AND is_workspace_member(workspace_id))
  WITH CHECK (user_id = auth.uid() AND is_workspace_member(workspace_id));

-- ====== SOURCE MIGRATION: 20261007000000_phase5_ai.sql ======
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  tool_action TEXT,
  tool_arguments JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ai_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'workspace',
  privacy TEXT NOT NULL DEFAULT 'private',
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.7,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ai_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily','weekly','monthly','quarterly')),
  objective TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project','goal','task','note','meeting')),
  entity_id UUID NOT NULL,
  summary TEXT NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_workspace_created ON public.ai_sessions(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memories_workspace ON public.ai_memories(workspace_id, key);
CREATE INDEX IF NOT EXISTS idx_ai_plans_workspace_date ON public.ai_plans(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_workspace_entity ON public.ai_reviews(workspace_id, entity_type, entity_id);

ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI sessions are workspace scoped" ON public.ai_sessions;
CREATE POLICY "AI sessions are workspace scoped" ON public.ai_sessions FOR ALL USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "AI memories are workspace scoped" ON public.ai_memories;
CREATE POLICY "AI memories are workspace scoped" ON public.ai_memories FOR ALL USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "AI plans are workspace scoped" ON public.ai_plans;
CREATE POLICY "AI plans are workspace scoped" ON public.ai_plans FOR ALL USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "AI reviews are workspace scoped" ON public.ai_reviews;
CREATE POLICY "AI reviews are workspace scoped" ON public.ai_reviews FOR ALL USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
-- =============================================================================
-- BLOCK 3 - RE-ASSERT GRANTS (final; protects against partial failures above)
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
