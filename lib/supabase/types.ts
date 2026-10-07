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

export interface Team {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  team_id: string;
  workspace_id: string;
  user_id: string;
  joined_at: string;
}

export interface ProjectMember {
  project_id: string;
  workspace_id: string;
  user_id: string;
  added_by: string;
  created_at: string;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  workspace_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile?: Profile;
}

export interface ApprovalRequest {
  id: string;
  workspace_id: string;
  project_id: string | null;
  requested_by: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  decided_by: string | null;
  decision_note: string | null;
  created_at: string;
  decided_at: string | null;
}

export interface WorkspaceUserPreference {
  workspace_id: string;
  user_id: string;
  preferences: {
    sidebarCollapsed: boolean;
    mobileSidebarOpen: boolean;
  };
  updated_at: string;
}

export interface Automation {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  trigger_type: "task_created" | "task_completed" | "deal_stage_changed" | "schedule";
  conditions: Array<{ field: string; operator: string; value: string }>;
  actions: Array<Record<string, unknown>>;
  enabled: boolean;
  repeat_interval: "once" | "daily" | "weekly" | "monthly" | null;
  next_run_at: string | null;
  last_run_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationRun {
  id: string;
  workspace_id: string;
  automation_id: string | null;
  automation_name: string;
  trigger_type: string;
  status: "success" | "failed" | "skipped";
  trigger_data: Record<string, unknown>;
  action_results: Array<Record<string, unknown>>;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface Notification {
  id: string;
  workspace_id: string;
  user_id: string;
  automation_id: string | null;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
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

// ============================================================================
// Phase 3: CRM, Meetings, Content, and Campaigns
// ============================================================================

export type CompanyStatus = "lead" | "customer" | "partner";
export type CompanySize = "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
export type DealStage = "lead" | "contacted" | "qualified" | "demo" | "evaluation" | "proposal" | "won" | "lost";
export type DealPriority = "low" | "medium" | "high" | "urgent";
export type CrmActivityType = "call" | "email" | "meeting" | "task";
export type ContactStatus = "lead" | "active" | "inactive";
export type ContentPlatform = "linkedin" | "twitter" | "blog" | "youtube" | "newsletter" | "instagram" | "tiktok";
export type ContentStage = "idea" | "draft" | "review" | "scheduled" | "published";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface Company {
  id: string;
  workspace_id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: CompanySize;
  status: CompanyStatus;
  notes?: string | null;
  website?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_id: string | null;
  status: ContactStatus;
  linkedin_url?: string | null;
  created_at: string;
  updated_at: string;
  company?: Company | null;
}

export interface Deal {
  id: string;
  workspace_id: string;
  title: string;
  value: number;
  stage: DealStage;
  priority: DealPriority;
  company_id: string | null;
  contact_id: string | null;
  description: string | null;
  status?: "open" | "won" | "lost";
  created_at: string;
  updated_at: string;
  company?: Company | null;
  contact?: Contact | null;
}

export interface CrmActivity {
  id: string;
  workspace_id: string;
  title: string;
  type: CrmActivityType;
  deal_id: string | null;
  due_date: string | null;
  description?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  deal?: Deal | null;
}

export interface MeetingParticipant {
  id?: string;
  name: string;
  email?: string;
  role?: string;
}

export interface MeetingDecision {
  id: string;
  decision: string;
  created_at?: string;
}

export interface MeetingActionItem {
  id: string;
  task_title: string;
  assignee: string | null;
  due_date: string | null;
  completed: boolean;
  created_task_id: string | null;
}

export interface MeetingFollowUp {
  id: string;
  title: string;
  description?: string;
  due_date: string | null;
  completed: boolean;
}

export interface Meeting {
  id: string;
  workspace_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  company_id: string | null;
  project_id: string | null;
  notes: string | null;
  participants: MeetingParticipant[];
  summary: string | null;
  decisions: MeetingDecision[];
  action_items: MeetingActionItem[];
  follow_ups: MeetingFollowUp[];
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  company?: Company | null;
  project?: Project | null;
}

export interface ContentMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  clicks?: number;
}

export interface ContentCampaign {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  workspace_id: string;
  title: string;
  platform: ContentPlatform;
  stage: ContentStage;
  campaign_id: string | null;
  project_id: string | null;
  scheduled_date: string | null;
  content_body: string;
  excerpt: string;
  metrics: ContentMetrics;
  created_at: string;
  updated_at: string;
  campaign?: ContentCampaign | null;
  project?: Project | null;
}

export interface CrmStats {
  totalPipelineValue: number;
  totalWonValue: number;
  openDealsCount: number;
  wonDealsCount: number;
  totalContacts: number;
  totalCompanies: number;
  pendingActivities: number;
}

export interface CreativeBoard {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  payload?: {
    elements?: Array<Record<string, unknown>>;
    connectors?: Array<Record<string, unknown>>;
    viewport?: { x: number; y: number; zoom: number };
  };
  created_by: string | null;
  created_at: string;
  updated_at: string;
  nodes?: CreativeNode[];
  connectors?: CreativeConnector[];
}

export interface CreativeNode {
  id: string;
  workspace_id: string;
  board_id: string;
  name: string;
  description: string;
  kind: "idea" | "task" | "project" | "architecture" | "note";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreativeConnector {
  id: string;
  workspace_id: string;
  board_id: string;
  source_node_id: string;
  target_node_id: string;
  label: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreativeTemplate {
  id: string;
  workspace_id: string;
  name: string;
  kind: "architecture" | "mindmap" | "roadmap" | "workflow" | "branded";
  nodes: Record<string, unknown>[];
  connectors: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

type DatabaseRaw = {
  public: {
    Functions: {
      add_workspace_member_by_email: {
        Args: { ws_id: string; member_email: string; member_role?: WorkspaceRole };
        Returns: string;
      };
    };
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
      teams: {
        Row: Team;
        Insert: Partial<Team> & { workspace_id: string; name: string; created_by: string };
        Update: Partial<Team>;
      };
      team_members: {
        Row: TeamMember;
        Insert: Partial<TeamMember> & { team_id: string; workspace_id: string; user_id: string };
        Update: Partial<TeamMember>;
      };
      project_members: {
        Row: ProjectMember;
        Insert: Partial<ProjectMember> & { project_id: string; workspace_id: string; user_id: string; added_by: string };
        Update: Partial<ProjectMember>;
      };
      project_comments: {
        Row: ProjectComment;
        Insert: Partial<ProjectComment> & { project_id: string; workspace_id: string; user_id: string; body: string };
        Update: Partial<ProjectComment>;
      };
      approval_requests: {
        Row: ApprovalRequest;
        Insert: Partial<ApprovalRequest> & { workspace_id: string; requested_by: string; title: string };
        Update: Partial<ApprovalRequest>;
      };
      workspace_user_preferences: {
        Row: WorkspaceUserPreference;
        Insert: {
          workspace_id: string;
          user_id: string;
          preferences: WorkspaceUserPreference["preferences"];
          updated_at?: string;
        };
        Update: Partial<WorkspaceUserPreference>;
      };
      automations: {
        Row: Automation;
        Insert: Partial<Automation> & { workspace_id: string; name: string; trigger_type: Automation["trigger_type"]; created_by: string };
        Update: Partial<Automation>;
      };
      automation_runs: {
        Row: AutomationRun;
        Insert: Partial<AutomationRun> & { workspace_id: string; automation_name: string; trigger_type: string; status: AutomationRun["status"] };
        Update: Partial<AutomationRun>;
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { workspace_id: string; user_id: string; title: string; message: string };
        Update: Partial<Notification>;
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
      companies: {
        Row: Company;
        Insert: Partial<Company> & { workspace_id: string; name: string };
        Update: Partial<Company>;
      };
      contacts: {
        Row: Contact;
        Insert: Partial<Contact> & { workspace_id: string; first_name: string; last_name: string };
        Update: Partial<Contact>;
      };
      deals: {
        Row: Deal;
        Insert: Partial<Deal> & { workspace_id: string; title: string };
        Update: Partial<Deal>;
      };
      crm_activities: {
        Row: CrmActivity;
        Insert: Partial<CrmActivity> & { workspace_id: string; title: string; type: CrmActivityType };
        Update: Partial<CrmActivity>;
      };
      meetings: {
        Row: Meeting;
        Insert: Partial<Meeting> & { workspace_id: string; title: string; scheduled_at: string };
        Update: Partial<Meeting>;
      };
      content_campaigns: {
        Row: ContentCampaign;
        Insert: Partial<ContentCampaign> & { workspace_id: string; name: string };
        Update: Partial<ContentCampaign>;
      };
      content_items: {
        Row: ContentItem;
        Insert: Partial<ContentItem> & { workspace_id: string; title: string; platform: ContentPlatform };
        Update: Partial<ContentItem>;
      };
      creative_boards: {
        Row: CreativeBoard;
        Insert: Partial<CreativeBoard> & { workspace_id: string; name: string };
        Update: Partial<CreativeBoard>;
      };
      creative_nodes: {
        Row: CreativeNode;
        Insert: Partial<CreativeNode> & { workspace_id: string; board_id: string; name: string };
        Update: Partial<CreativeNode>;
      };
      creative_connectors: {
        Row: CreativeConnector;
        Insert: Partial<CreativeConnector> & { workspace_id: string; board_id: string; source_node_id: string; target_node_id: string };
        Update: Partial<CreativeConnector>;
      };
      creative_templates: {
        Row: CreativeTemplate;
        Insert: Partial<CreativeTemplate> & { workspace_id: string; name: string; kind: CreativeTemplate["kind"] };
        Update: Partial<CreativeTemplate>;
      };
      ai_sessions: {
        Row: { id: string; workspace_id: string; prompt: string; response: string; model: string; input_tokens: number; output_tokens: number; tool_action: string | null; tool_arguments: Record<string, unknown>; created_at: string };
        Insert: { workspace_id: string; prompt: string; response?: string; model: string; input_tokens?: number; output_tokens?: number; tool_action?: string | null; tool_arguments?: Record<string, unknown>; created_at?: string };
        Update: Partial<{ prompt: string; response: string; model: string; input_tokens: number; output_tokens: number; tool_action: string | null; tool_arguments: Record<string, unknown> }>;
      };
      ai_memories: {
        Row: { id: string; workspace_id: string; key: string; value: string; source: string; scope: string; privacy: string; confidence: number; updated_at: string };
        Insert: { workspace_id: string; key: string; value: string; source: string; scope: string; privacy: string; confidence: number; updated_at?: string };
        Update: Partial<{ key: string; value: string; source: string; scope: string; privacy: string; confidence: number }>;
      };
      ai_plans: {
        Row: { id: string; workspace_id: string; period: "daily" | "weekly" | "monthly" | "quarterly"; objective: string; summary: string; payload: Record<string, unknown>; created_at: string; updated_at: string };
        Insert: { workspace_id: string; period: "daily" | "weekly" | "monthly" | "quarterly"; objective: string; summary: string; payload: Record<string, unknown>; created_at?: string; updated_at?: string };
        Update: Partial<{ period: "daily" | "weekly" | "monthly" | "quarterly"; objective: string; summary: string; payload: Record<string, unknown> }>;
      };
      ai_reviews: {
        Row: { id: string; workspace_id: string; entity_type: "project" | "goal" | "task" | "note" | "meeting"; entity_id: string; summary: string; findings: Array<{ severity: "info" | "warning" | "critical"; message: string }>; created_at: string };
        Insert: { workspace_id: string; entity_type: "project" | "goal" | "task" | "note" | "meeting"; entity_id: string; summary: string; findings: Array<{ severity: "info" | "warning" | "critical"; message: string }>; created_at?: string };
        Update: Partial<{ entity_type: "project" | "goal" | "task" | "note" | "meeting"; entity_id: string; summary: string; findings: Array<{ severity: "info" | "warning" | "critical"; message: string }> }>;
      };
    };
  };
};

// ============================================================================
// Database (supabase-js generic-compatible)
// ============================================================================
// supabase-js 2.x requires every table entry to carry a `Relationships` array
// and the schema to declare `Views` and `Functions`; without them the client's
// Schema generic collapses insert/update types to `never`.
// Row/Insert/Update above are declared as TS interfaces, which lack implicit
// index signatures and fail the GenericTable `Record<string, unknown>`
// constraint — the homomorphic mapped types below restore them.

type Loose<T> = { [P in keyof T]: T[P] };

type DatabaseTables = DatabaseRaw["public"]["Tables"];

type DatabaseTablesWithRelationships = {
  [K in keyof DatabaseTables]: {
    Row: Loose<DatabaseTables[K]["Row"]>;
    Insert: Loose<DatabaseTables[K]["Insert"]>;
    Update: Loose<DatabaseTables[K]["Update"]>;
    Relationships: [];
  };
};

export type Database = {
  public: {
    Tables: DatabaseTablesWithRelationships;
    Views: Record<string, never>;
    Functions: DatabaseRaw["public"]["Functions"];
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
