export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  workspace?: Workspace;
  profile?: Profile;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ==============================================================================
// Phase 1 Core OS Types
// ==============================================================================

export type GoalTimeframe = "vision" | "year" | "quarter" | "month" | "week" | "day";
export type GoalStatus = "active" | "completed" | "paused" | "archived";
export type PriorityLevel = "low" | "medium" | "high" | "urgent";

export interface Goal {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  timeframe: GoalTimeframe;
  status: GoalStatus;
  priority: PriorityLevel;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string | null;
  deadline: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  children?: Goal[];
  projects_count?: number;
  tasks_count?: number;
}

export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed" | "archived";

export interface Project {
  id: string;
  workspace_id: string;
  goal_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  priority: PriorityLevel;
  color: string;
  start_date: string | null;
  target_date: string | null;
  progress_percent: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  goal?: Goal | null;
  tasks_total?: number;
  tasks_done?: number;
}

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done" | "cancelled";

export interface Task {
  id: string;
  workspace_id: string;
  project_id: string | null;
  goal_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: PriorityLevel;
  due_date: string | null;
  start_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  is_my_day: boolean;
  labels: string[];
  recurrence: string | null;
  order_index: number;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project?: Project | null;
  goal?: Goal | null;
}

export type PlanType = "daily" | "weekly" | "monthly" | "quarterly";
export type PlanStatus = "draft" | "active" | "completed";

export interface PlanItem {
  id: string;
  plan_id: string;
  task_id: string | null;
  title: string;
  time_block: string | null;
  is_completed: boolean;
  priority: PriorityLevel;
  order_index: number;
  created_at: string;
  task?: Task | null;
}

export interface Plan {
  id: string;
  workspace_id: string;
  user_id: string;
  type: PlanType;
  target_date: string;
  objective: string | null;
  summary: string | null;
  status: PlanStatus;
  metrics: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  items?: PlanItem[];
}

export type CalendarEventType = "event" | "task" | "meeting" | "milestone" | "focus";

export interface CalendarEvent {
  id: string;
  workspace_id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  event_type: CalendarEventType;
  task_id: string | null;
  project_id: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  task?: Task | null;
  project?: Project | null;
}

// Phase 2: Knowledge Types
export type FolderType = "notes" | "files" | "bookmarks" | "general";

export interface Folder {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  type: FolderType;
  color: string;
  icon?: string | null;
  order_index: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  notes_count?: number;
  files_count?: number;
  bookmarks_count?: number;
}

export interface Tag {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
  notes_count?: number;
}

export interface Note {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  project_id: string | null;
  goal_id: string | null;
  task_id: string | null;
  title: string;
  content: Record<string, unknown>;
  content_html: string;
  plain_text: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  folder?: Folder | null;
  project?: Project | null;
  goal?: Goal | null;
  task?: Task | null;
  tags?: Tag[];
  backlinks_count?: number;
}

export type KnowledgeEntityType = "note" | "project" | "goal" | "task" | "bookmark";

export interface KnowledgeBacklink {
  id: string;
  workspace_id: string;
  source_note_id: string;
  target_note_id: string | null;
  target_entity_type: KnowledgeEntityType;
  target_entity_id: string | null;
  link_text: string | null;
  context_snippet: string | null;
  created_at: string;
  source_note?: Note | null;
  target_note?: Note | null;
}

export type FileCategory = "pdf" | "image" | "video" | "audio" | "csv" | "document" | "archive" | "other";

export interface FileItem {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  project_id: string | null;
  task_id: string | null;
  note_id: string | null;
  name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: FileCategory;
  labels: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  folder?: Folder | null;
  project?: Project | null;
}

export interface Bookmark {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  project_id: string | null;
  url: string;
  title: string;
  description: string | null;
  domain: string;
  favicon_url: string | null;
  tags: string[];
  notes: string | null;
  ai_summary: string | null;
  is_favorite: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  folder?: Folder | null;
  project?: Project | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
      };
      workspaces: {
        Row: Workspace;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          avatar_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Workspace>;
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          joined_at?: string;
        };
        Update: Partial<WorkspaceMember>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<AuditLog>;
      };
      goals: {
        Row: Goal;
        Insert: Partial<Goal> & { workspace_id: string; title: string };
        Update: Partial<Goal>;
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & { workspace_id: string; name: string; slug: string };
        Update: Partial<Project>;
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task> & { workspace_id: string; title: string };
        Update: Partial<Task>;
      };
      plans: {
        Row: Plan;
        Insert: Partial<Plan> & { workspace_id: string; user_id: string; target_date: string };
        Update: Partial<Plan>;
      };
      plan_items: {
        Row: PlanItem;
        Insert: Partial<PlanItem> & { plan_id: string; title: string };
        Update: Partial<PlanItem>;
      };
      calendar_events: {
        Row: CalendarEvent;
        Insert: Partial<CalendarEvent> & { workspace_id: string; title: string; start_time: string; end_time: string };
        Update: Partial<CalendarEvent>;
      };
      folders: {
        Row: Folder;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      tags: {
        Row: Tag;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      notes: {
        Row: Note;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      knowledge_backlinks: {
        Row: KnowledgeBacklink;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      files: {
        Row: FileItem;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      bookmarks: {
        Row: Bookmark;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
  };
};
