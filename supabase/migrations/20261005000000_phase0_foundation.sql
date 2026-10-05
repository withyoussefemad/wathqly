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
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Workspaces: Members can view workspaces they belong to
CREATE POLICY "Members can view workspaces"
  ON public.workspaces FOR SELECT
  USING (
    id IN (SELECT get_current_user_workspaces())
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND created_by = auth.uid()
  );

CREATE POLICY "Owners and admins can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (
    is_workspace_admin_or_owner(id)
  );

CREATE POLICY "Only workspace owner can delete workspace"
  ON public.workspaces FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Workspace Members: Members can view all members in their workspaces
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (
    is_workspace_member(workspace_id)
  );

CREATE POLICY "Owners/admins can add or manage members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    is_workspace_admin_or_owner(workspace_id) OR
    -- Allow initial owner insertion during workspace creation
    (user_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Owners/admins can update members"
  ON public.workspace_members FOR UPDATE
  USING (
    is_workspace_admin_or_owner(workspace_id)
  );

CREATE POLICY "Owners/admins can remove members"
  ON public.workspace_members FOR DELETE
  USING (
    is_workspace_admin_or_owner(workspace_id) OR user_id = auth.uid()
  );

-- Audit Logs: Viewable only by workspace members
CREATE POLICY "Members can view workspace audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    is_workspace_member(workspace_id)
  );

CREATE POLICY "System can record audit logs"
  ON public.audit_logs FOR INSERT
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
