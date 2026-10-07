CREATE OR REPLACE FUNCTION public.has_workspace_role(ws_id UUID, minimum_role workspace_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid() AND CASE minimum_role
      WHEN 'owner' THEN role = 'owner'
      WHEN 'admin' THEN role IN ('owner', 'admin')
      WHEN 'member' THEN role IN ('owner', 'admin', 'member')
      WHEN 'viewer' THEN role IN ('owner', 'admin', 'member', 'viewer')
    END
  );
$$;

REVOKE ALL ON FUNCTION public.has_workspace_role(UUID, workspace_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(UUID, workspace_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.add_workspace_member_by_email(ws_id UUID, member_email TEXT, member_role workspace_role DEFAULT 'member')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role workspace_role;
  member_user_id UUID;
  inserted_count INTEGER;
BEGIN
  SELECT role INTO actor_role
  FROM public.workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid();

  IF actor_role IS NULL OR actor_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Workspace administrator role required';
  END IF;
  IF member_role = 'owner' OR (member_role = 'admin' AND actor_role <> 'owner') THEN
    RAISE EXCEPTION 'You cannot assign that role';
  END IF;

  SELECT id INTO member_user_id
  FROM public.profiles
  WHERE lower(email) = lower(trim(member_email));
  IF member_user_id IS NULL THEN
    RAISE EXCEPTION 'No registered account found for that email';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, member_user_id, member_role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    RAISE EXCEPTION 'Account is already a workspace member';
  END IF;

  RETURN member_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_workspace_member_by_email(UUID, TEXT, workspace_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_workspace_member_by_email(UUID, TEXT, workspace_role) TO authenticated;

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 300),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (id, workspace_id),
  UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS public.team_members (
  team_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id, workspace_id) REFERENCES public.teams(id, workspace_id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, user_id) REFERENCES public.workspace_members(workspace_id, user_id) ON DELETE CASCADE
);

DO $$ BEGIN
  ALTER TABLE public.projects ADD CONSTRAINT projects_id_workspace_unique UNIQUE (id, workspace_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

UPDATE public.projects project
SET created_by = workspace.created_by
FROM public.workspaces workspace
WHERE project.workspace_id = workspace.id AND project.created_by IS NULL;

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id, workspace_id) REFERENCES public.projects(id, workspace_id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, user_id) REFERENCES public.workspace_members(workspace_id, user_id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION public.can_access_project(target_project_id UUID, target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects project
    WHERE project.id = target_project_id
      AND project.workspace_id = target_workspace_id
      AND (
        project.created_by = auth.uid()
        OR has_workspace_role(target_workspace_id, 'admin')
        OR EXISTS (
          SELECT 1 FROM public.project_members assignment
          WHERE assignment.project_id = project.id
            AND assignment.workspace_id = target_workspace_id
            AND assignment.user_id = auth.uid()
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_project(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_project(UUID, UUID) TO authenticated;

CREATE TABLE IF NOT EXISTS public.project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 3000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  FOREIGN KEY (project_id, workspace_id) REFERENCES public.projects(id, workspace_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 160),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 3000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision_note TEXT CHECK (char_length(decision_note) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  decided_at TIMESTAMPTZ,
  FOREIGN KEY (project_id, workspace_id) REFERENCES public.projects(id, workspace_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teams_workspace ON public.teams(workspace_id, name);
CREATE INDEX IF NOT EXISTS idx_team_members_workspace_user ON public.team_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_workspace ON public.project_members(workspace_id, project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_project ON public.project_comments(workspace_id, project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_workspace ON public.approval_requests(workspace_id, status, created_at DESC);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members read teams" ON public.teams FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Admins manage teams" ON public.teams FOR ALL USING (has_workspace_role(workspace_id, 'admin')) WITH CHECK (has_workspace_role(workspace_id, 'admin'));
CREATE POLICY "Workspace members read team assignments" ON public.team_members FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Admins manage team assignments" ON public.team_members FOR ALL USING (has_workspace_role(workspace_id, 'admin')) WITH CHECK (has_workspace_role(workspace_id, 'admin'));
CREATE POLICY "Project participants read project assignments" ON public.project_members FOR SELECT USING (has_workspace_role(workspace_id, 'admin') OR can_access_project(project_id, workspace_id));
CREATE POLICY "Admins manage project assignments" ON public.project_members FOR ALL USING (has_workspace_role(workspace_id, 'admin')) WITH CHECK (has_workspace_role(workspace_id, 'admin'));
CREATE POLICY "Workspace members read project comments" ON public.project_comments FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members add project comments" ON public.project_comments FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'member') AND user_id = auth.uid());
CREATE POLICY "Assigned members access project comments" ON public.project_comments AS RESTRICTIVE FOR SELECT USING (can_access_project(project_id, workspace_id));
CREATE POLICY "Members comment on accessible projects" ON public.project_comments AS RESTRICTIVE FOR INSERT WITH CHECK (can_access_project(project_id, workspace_id));
CREATE POLICY "Workspace members read approval requests" ON public.approval_requests FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "Members create approval requests" ON public.approval_requests FOR INSERT WITH CHECK (has_workspace_role(workspace_id, 'member') AND requested_by = auth.uid());
CREATE POLICY "Project approvals follow project access" ON public.approval_requests AS RESTRICTIVE FOR SELECT USING (project_id IS NULL OR can_access_project(project_id, workspace_id));
CREATE POLICY "Members request approval on accessible project" ON public.approval_requests AS RESTRICTIVE FOR INSERT WITH CHECK (project_id IS NULL OR can_access_project(project_id, workspace_id));
CREATE POLICY "Admins decide approval requests" ON public.approval_requests FOR UPDATE USING (has_workspace_role(workspace_id, 'admin')) WITH CHECK (has_workspace_role(workspace_id, 'admin'));
CREATE POLICY "Members can view teammate profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members target_member
    WHERE target_member.user_id = profiles.id
      AND is_workspace_member(target_member.workspace_id)
  )
);

DROP POLICY IF EXISTS "Members can view workspace projects" ON public.projects;
CREATE POLICY "Assigned members can view projects" ON public.projects FOR SELECT
USING (has_workspace_role(workspace_id, 'viewer') AND can_access_project(id, workspace_id));
DROP POLICY IF EXISTS "Members can insert workspace projects" ON public.projects;
CREATE POLICY "Members create their own projects" ON public.projects FOR INSERT
WITH CHECK (has_workspace_role(workspace_id, 'member') AND created_by = auth.uid());
DROP POLICY IF EXISTS "Members can update workspace projects" ON public.projects;
CREATE POLICY "Assigned members update projects" ON public.projects FOR UPDATE
USING (has_workspace_role(workspace_id, 'member') AND can_access_project(id, workspace_id))
WITH CHECK (has_workspace_role(workspace_id, 'member') AND can_access_project(id, workspace_id));
DROP POLICY IF EXISTS "Members can delete workspace projects" ON public.projects;
CREATE POLICY "Admins delete projects" ON public.projects FOR DELETE
USING (has_workspace_role(workspace_id, 'admin'));

DROP POLICY IF EXISTS "Members can view workspace tasks" ON public.tasks;
CREATE POLICY "Assigned members view tasks" ON public.tasks FOR SELECT
USING (has_workspace_role(workspace_id, 'viewer') AND (project_id IS NULL OR can_access_project(project_id, workspace_id)));
DROP POLICY IF EXISTS "Members can insert workspace tasks" ON public.tasks;
CREATE POLICY "Members create accessible tasks" ON public.tasks FOR INSERT
WITH CHECK (has_workspace_role(workspace_id, 'member') AND (project_id IS NULL OR can_access_project(project_id, workspace_id)));
DROP POLICY IF EXISTS "Members can update workspace tasks" ON public.tasks;
CREATE POLICY "Members update accessible tasks" ON public.tasks FOR UPDATE
USING (has_workspace_role(workspace_id, 'member') AND (project_id IS NULL OR can_access_project(project_id, workspace_id)))
WITH CHECK (has_workspace_role(workspace_id, 'member') AND (project_id IS NULL OR can_access_project(project_id, workspace_id)));
DROP POLICY IF EXISTS "Members can delete workspace tasks" ON public.tasks;
CREATE POLICY "Members delete accessible tasks" ON public.tasks FOR DELETE
USING (has_workspace_role(workspace_id, 'member') AND (project_id IS NULL OR can_access_project(project_id, workspace_id)));

DROP POLICY IF EXISTS "Owners/admins can update members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners/admins can add or manage members" ON public.workspace_members;
CREATE POLICY "Workspace role-safe member addition" ON public.workspace_members FOR INSERT
WITH CHECK (
  (
    user_id = auth.uid()
    AND role = 'owner'
    AND EXISTS (SELECT 1 FROM public.workspaces created_workspace WHERE created_workspace.id = workspace_id AND created_workspace.created_by = auth.uid())
  )
  OR (
    has_workspace_role(workspace_id, 'admin')
    AND role <> 'owner'
    AND (has_workspace_role(workspace_id, 'owner') OR role IN ('member', 'viewer'))
  )
);

CREATE POLICY "Workspace role-safe member updates" ON public.workspace_members FOR UPDATE
USING (
  has_workspace_role(workspace_id, 'admin')
  AND role <> 'owner'
  AND (has_workspace_role(workspace_id, 'owner') OR role IN ('member', 'viewer'))
)
WITH CHECK (
  has_workspace_role(workspace_id, 'admin')
  AND role <> 'owner'
  AND (has_workspace_role(workspace_id, 'owner') OR role IN ('member', 'viewer'))
);

DROP POLICY IF EXISTS "Owners/admins can remove members" ON public.workspace_members;
CREATE POLICY "Workspace role-safe member removal" ON public.workspace_members FOR DELETE
USING (
  role <> 'owner'
  AND (
    user_id = auth.uid()
    OR (has_workspace_role(workspace_id, 'admin') AND (has_workspace_role(workspace_id, 'owner') OR role IN ('member', 'viewer')))
  )
);

DO $$
DECLARE
  table_name TEXT;
  project_tables TEXT[] := ARRAY['calendar_events', 'notes', 'content_items', 'meetings'];
BEGIN
  FOREACH table_name IN ARRAY project_tables LOOP
    EXECUTE format('CREATE POLICY "Assigned members view project data %1$s" ON public.%1$I AS RESTRICTIVE FOR SELECT USING (project_id IS NULL OR can_access_project(project_id, workspace_id))', table_name);
    EXECUTE format('CREATE POLICY "Members write accessible project data %1$s" ON public.%1$I AS RESTRICTIVE FOR INSERT WITH CHECK (project_id IS NULL OR can_access_project(project_id, workspace_id))', table_name);
    EXECUTE format('CREATE POLICY "Members update accessible project data %1$s" ON public.%1$I AS RESTRICTIVE FOR UPDATE USING (project_id IS NULL OR can_access_project(project_id, workspace_id)) WITH CHECK (project_id IS NULL OR can_access_project(project_id, workspace_id))', table_name);
  END LOOP;
END $$;

DO $$
DECLARE
  table_name TEXT;
  workspace_tables TEXT[] := ARRAY[
    'goals', 'projects', 'tasks', 'plans', 'calendar_events',
    'folders', 'tags', 'notes', 'knowledge_backlinks', 'files', 'bookmarks',
    'companies', 'contacts', 'deals', 'crm_activities', 'meetings', 'content_campaigns', 'content_items',
    'creative_boards', 'creative_nodes', 'creative_connectors', 'creative_templates',
    'ai_sessions', 'ai_memories', 'ai_plans', 'ai_reviews',
    'automations', 'automation_runs', 'notifications', 'teams', 'team_members', 'project_members', 'project_comments', 'approval_requests'
  ];
BEGIN
  FOREACH table_name IN ARRAY workspace_tables LOOP
    EXECUTE format('CREATE POLICY "Workspace roles can read %1$s" ON public.%1$I AS RESTRICTIVE FOR SELECT USING (has_workspace_role(workspace_id, ''viewer''))', table_name);
    EXECUTE format('CREATE POLICY "Workspace roles can insert %1$s" ON public.%1$I AS RESTRICTIVE FOR INSERT WITH CHECK (has_workspace_role(workspace_id, ''member''))', table_name);
    EXECUTE format('CREATE POLICY "Workspace roles can update %1$s" ON public.%1$I AS RESTRICTIVE FOR UPDATE USING (has_workspace_role(workspace_id, ''member'')) WITH CHECK (has_workspace_role(workspace_id, ''member''))', table_name);
    EXECUTE format('CREATE POLICY "Workspace roles can delete %1$s" ON public.%1$I AS RESTRICTIVE FOR DELETE USING (has_workspace_role(workspace_id, ''member''))', table_name);
  END LOOP;
END $$;
