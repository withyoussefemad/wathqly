"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/actions/workspace";
import {
  createGoalSchema,
  createProjectSchema,
  createTaskSchema,
  createPlanSchema,
  createCalendarEventSchema,
} from "@/schemas/core-os";
import type {
  Goal,
  Project,
  Task,
  Plan,
  CalendarEvent,
  TaskStatus,
} from "@/lib/supabase/types";

// Fallback initial seeds for offline/development mode
const SEED_GOALS: Goal[] = [
  {
    id: "g-1",
    workspace_id: "demo-ws-1",
    parent_id: null,
    title: "Launch Wathqly Personal OS",
    description: "Build an AI-native, connected operating system for personal life and founders.",
    timeframe: "quarter",
    status: "active",
    priority: "high",
    target_value: 100,
    current_value: 70,
    unit: "%",
    start_date: "2026-10-01",
    deadline: "2026-12-31",
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    projects_count: 2,
    tasks_count: 8,
  },
  {
    id: "g-2",
    workspace_id: "demo-ws-1",
    parent_id: null,
    title: "CertiLayer Enterprise Growth",
    description: "Acquire first cohort of enterprise design partners.",
    timeframe: "year",
    status: "active",
    priority: "urgent",
    target_value: 20,
    current_value: 8,
    unit: "customers",
    start_date: "2026-01-01",
    deadline: "2026-12-31",
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    projects_count: 1,
    tasks_count: 5,
  },
  {
    id: "g-3",
    workspace_id: "demo-ws-1",
    parent_id: "g-1",
    title: "Knowledge & Notes System",
    description: "Tiptap editor, backlinks, tags, and document storage.",
    timeframe: "month",
    status: "active",
    priority: "medium",
    target_value: 10,
    current_value: 3,
    unit: "specs",
    start_date: "2026-10-01",
    deadline: "2026-10-31",
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    projects_count: 1,
    tasks_count: 3,
  },
];

const SEED_PROJECTS: Project[] = [
  {
    id: "p-1",
    workspace_id: "demo-ws-1",
    goal_id: "g-1",
    name: "Wathqly Core OS",
    slug: "wathqly-core-os",
    description: "Home, Goals, Plans, Tasks, Projects & Calendar unified connected loop.",
    status: "in_progress",
    priority: "high",
    color: "#7C3AED",
    start_date: "2026-10-05",
    target_date: "2026-10-20",
    progress_percent: 60,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tasks_total: 8,
    tasks_done: 5,
  },
  {
    id: "p-2",
    workspace_id: "demo-ws-1",
    goal_id: "g-2",
    name: "CertiLayer Partner Pipeline",
    slug: "certilayer-partners",
    description: "Enterprise outreach, compliance security reviews, and pilot rollouts.",
    status: "in_progress",
    priority: "medium",
    color: "#3B82F6",
    start_date: "2026-10-01",
    target_date: "2026-11-15",
    progress_percent: 40,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tasks_total: 5,
    tasks_done: 2,
  },
];

const SEED_TASKS: Task[] = [
  {
    id: "t-1",
    workspace_id: "demo-ws-1",
    project_id: "p-1",
    goal_id: "g-1",
    parent_task_id: null,
    title: "Implement Core OS schema migrations and RLS",
    description: "Write PostgreSQL migrations for goals, projects, tasks, plans, and events with RLS.",
    status: "done",
    priority: "urgent",
    due_date: new Date().toISOString(),
    start_date: new Date().toISOString(),
    estimated_minutes: 60,
    actual_minutes: 45,
    is_my_day: true,
    labels: ["Database", "Security"],
    recurrence: null,
    order_index: 0,
    completed_at: new Date().toISOString(),
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t-2",
    workspace_id: "demo-ws-1",
    project_id: "p-1",
    goal_id: "g-1",
    parent_task_id: null,
    title: "Build Goals hierarchy and progress tracking views",
    description: "Vision -> Year -> Quarter -> Month breakdown with measurable values.",
    status: "in_progress",
    priority: "high",
    due_date: new Date().toISOString(),
    start_date: new Date().toISOString(),
    estimated_minutes: 90,
    actual_minutes: null,
    is_my_day: true,
    labels: ["Core OS", "Goals"],
    recurrence: null,
    order_index: 1,
    completed_at: null,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t-3",
    workspace_id: "demo-ws-1",
    project_id: "p-1",
    goal_id: "g-1",
    parent_task_id: null,
    title: "Design Daily & Weekly planning interface",
    description: "Time blocks, strategic objective, and AI planning assistant proposal.",
    status: "todo",
    priority: "high",
    due_date: new Date(Date.now() + 86400000).toISOString(),
    start_date: null,
    estimated_minutes: 75,
    actual_minutes: null,
    is_my_day: true,
    labels: ["Planning"],
    recurrence: null,
    order_index: 2,
    completed_at: null,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t-4",
    workspace_id: "demo-ws-1",
    project_id: "p-2",
    goal_id: "g-2",
    parent_task_id: null,
    title: "Prepare enterprise compliance architecture brief",
    description: "Review data residency and tenant isolation parameters for CertiLayer clients.",
    status: "todo",
    priority: "medium",
    due_date: new Date(Date.now() + 172800000).toISOString(),
    start_date: null,
    estimated_minutes: 120,
    actual_minutes: null,
    is_my_day: false,
    labels: ["Enterprise", "Security"],
    recurrence: null,
    order_index: 3,
    completed_at: null,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t-5",
    workspace_id: "demo-ws-1",
    project_id: "p-1",
    goal_id: "g-1",
    parent_task_id: null,
    title: "Conduct weekly reflection and milestone audit",
    description: "Reflect on accomplishments, metrics, and plan next sprint cycles.",
    status: "todo",
    priority: "low",
    due_date: new Date(Date.now() + 259200000).toISOString(),
    start_date: null,
    estimated_minutes: 45,
    actual_minutes: null,
    is_my_day: false,
    labels: ["Reflection"],
    recurrence: "weekly",
    order_index: 4,
    completed_at: null,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_CALENDAR: CalendarEvent[] = [
  {
    id: "e-1",
    workspace_id: "demo-ws-1",
    user_id: "demo-user",
    title: "Architecture & Core OS Review",
    description: "Review schema relations, RLS, and data consistency.",
    start_time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
    all_day: false,
    event_type: "meeting",
    task_id: "t-1",
    project_id: "p-1",
    color: "#7C3AED",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "e-2",
    workspace_id: "demo-ws-1",
    user_id: "demo-user",
    title: "Deep Work: Goals & Planning System",
    description: "Implement interactive UI and server actions for planning.",
    start_time: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(16, 30, 0, 0)).toISOString(),
    all_day: false,
    event_type: "focus",
    task_id: "t-2",
    project_id: "p-1",
    color: "#8B5CF6",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "e-3",
    workspace_id: "demo-ws-1",
    user_id: "demo-user",
    title: "Daily Execution Sync & Wrap-up",
    description: "Check off completed items and plan tomorrow's priority blocks.",
    start_time: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(),
    end_time: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
    all_day: false,
    event_type: "event",
    task_id: null,
    project_id: null,
    color: "#22C55E",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to determine if Supabase is connected or fallback
async function getSupabaseSafe() {
  try {
    const supabase = await createClient();
    const isConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
    );
    if (!isConfigured) return null;
    return supabase;
  } catch {
    return null;
  }
}

// ==============================================================================
// 1. GOALS ACTIONS
// ==============================================================================
export async function getGoalsAction(workspaceId?: string): Promise<Goal[]> {
  const ws = workspaceId ? { id: workspaceId } : await getActiveWorkspace();
  const targetWsId = ws?.id || "demo-ws-1";

  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("workspace_id", targetWsId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Goal[];
    }
  }

  return SEED_GOALS.filter((g) => g.workspace_id === targetWsId || targetWsId === "demo-ws-1");
}

export async function createGoalAction(formData: FormData) {
  const ws = await getActiveWorkspace();
  const workspaceId = ws?.id || "demo-ws-1";

  const raw = {
    workspaceId,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    timeframe: formData.get("timeframe") || "quarter",
    priority: formData.get("priority") || "medium",
    targetValue: Number(formData.get("targetValue") || 100),
    currentValue: Number(formData.get("currentValue") || 0),
    unit: (formData.get("unit") as string) || "%",
    deadline: formData.get("deadline") || undefined,
  };

  const parsed = createGoalSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("goals").insert({
      workspace_id: workspaceId,
      title: parsed.data.title,
      description: parsed.data.description,
      timeframe: parsed.data.timeframe,
      priority: parsed.data.priority,
      target_value: parsed.data.targetValue,
      current_value: parsed.data.currentValue,
      unit: parsed.data.unit,
      deadline: parsed.data.deadline,
    } as any).select().single();

    if (error) return { success: false, message: error.message };
    revalidatePath("/goals");
    revalidatePath("/home");
    return { success: true, data };
  }

  // Local fallback
  const newGoal: Goal = {
    id: `g-${Date.now()}`,
    workspace_id: workspaceId,
    parent_id: null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    timeframe: parsed.data.timeframe,
    status: "active",
    priority: parsed.data.priority,
    target_value: parsed.data.targetValue,
    current_value: parsed.data.currentValue,
    unit: parsed.data.unit,
    start_date: new Date().toISOString().split("T")[0],
    deadline: parsed.data.deadline || null,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  SEED_GOALS.unshift(newGoal);

  revalidatePath("/goals");
  revalidatePath("/home");
  return { success: true, data: newGoal };
}

// ==============================================================================
// 2. PROJECTS ACTIONS
// ==============================================================================
export async function getProjectsAction(workspaceId?: string): Promise<Project[]> {
  const ws = workspaceId ? { id: workspaceId } : await getActiveWorkspace();
  const targetWsId = ws?.id || "demo-ws-1";

  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase
      .from("projects")
      .select("*, goals(*)")
      .eq("workspace_id", targetWsId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Project[];
    }
  }

  return SEED_PROJECTS.filter((p) => p.workspace_id === targetWsId || targetWsId === "demo-ws-1");
}

export async function createProjectAction(formData: FormData) {
  const ws = await getActiveWorkspace();
  const workspaceId = ws?.id || "demo-ws-1";

  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/[^a-z0-9]/g, "-");

  const raw = {
    workspaceId,
    name,
    slug,
    goalId: formData.get("goalId") || undefined,
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || "medium",
    color: formData.get("color") || "#7C3AED",
    targetDate: formData.get("targetDate") || undefined,
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("projects").insert({
      workspace_id: workspaceId,
      name: parsed.data.name,
      slug: parsed.data.slug || slug,
      goal_id: parsed.data.goalId,
      description: parsed.data.description,
      priority: parsed.data.priority,
      color: parsed.data.color,
      target_date: parsed.data.targetDate,
    } as any).select().single();

    if (error) return { success: false, message: error.message };
    revalidatePath("/projects");
    revalidatePath("/home");
    return { success: true, data };
  }

  const newProject: Project = {
    id: `p-${Date.now()}`,
    workspace_id: workspaceId,
    goal_id: parsed.data.goalId || null,
    name: parsed.data.name,
    slug: parsed.data.slug || slug,
    description: parsed.data.description || null,
    status: "in_progress",
    priority: parsed.data.priority,
    color: parsed.data.color,
    start_date: new Date().toISOString().split("T")[0],
    target_date: parsed.data.targetDate || null,
    progress_percent: 0,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tasks_total: 0,
    tasks_done: 0,
  };
  SEED_PROJECTS.unshift(newProject);

  revalidatePath("/projects");
  revalidatePath("/home");
  return { success: true, data: newProject };
}

// ==============================================================================
// 3. TASKS ACTIONS
// ==============================================================================
export async function getTasksAction(workspaceId?: string, options?: { myDayOnly?: boolean; status?: string }): Promise<Task[]> {
  const ws = workspaceId ? { id: workspaceId } : await getActiveWorkspace();
  const targetWsId = ws?.id || "demo-ws-1";

  const supabase = await getSupabaseSafe();
  if (supabase) {
    let query = supabase
      .from("tasks")
      .select("*, projects(name, color), goals(title)")
      .eq("workspace_id", targetWsId)
      .order("order_index", { ascending: true });

    if (options?.myDayOnly) {
      query = query.eq("is_my_day", true);
    }
    if (options?.status) {
      query = query.eq("status", options.status);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as Task[];
    }
  }

  let list = SEED_TASKS.filter((t) => t.workspace_id === targetWsId || targetWsId === "demo-ws-1");
  if (options?.myDayOnly) {
    list = list.filter((t) => t.is_my_day);
  }
  if (options?.status) {
    list = list.filter((t) => t.status === options.status);
  }
  return list;
}

export async function createTaskAction(formData: FormData) {
  const ws = await getActiveWorkspace();
  const workspaceId = ws?.id || "demo-ws-1";

  const raw = {
    workspaceId,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    projectId: formData.get("projectId") || undefined,
    goalId: formData.get("goalId") || undefined,
    priority: formData.get("priority") || "medium",
    dueDate: formData.get("dueDate") || undefined,
    isMyDay: formData.get("isMyDay") === "true",
    estimatedMinutes: formData.get("estimatedMinutes") ? Number(formData.get("estimatedMinutes")) : undefined,
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("tasks").insert({
      workspace_id: workspaceId,
      title: parsed.data.title,
      description: parsed.data.description,
      project_id: parsed.data.projectId,
      goal_id: parsed.data.goalId,
      priority: parsed.data.priority,
      due_date: parsed.data.dueDate,
      is_my_day: parsed.data.isMyDay,
      estimated_minutes: parsed.data.estimatedMinutes,
    } as any).select().single();

    if (error) return { success: false, message: error.message };
    revalidatePath("/tasks");
    revalidatePath("/home");
    revalidatePath("/plan");
    return { success: true, data };
  }

  const newTask: Task = {
    id: `t-${Date.now()}`,
    workspace_id: workspaceId,
    project_id: parsed.data.projectId || null,
    goal_id: parsed.data.goalId || null,
    parent_task_id: null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    status: "todo",
    priority: parsed.data.priority,
    due_date: parsed.data.dueDate || null,
    start_date: null,
    estimated_minutes: parsed.data.estimatedMinutes || null,
    actual_minutes: null,
    is_my_day: parsed.data.isMyDay,
    labels: [],
    recurrence: null,
    order_index: SEED_TASKS.length,
    completed_at: null,
    created_by: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  SEED_TASKS.unshift(newTask);

  revalidatePath("/tasks");
  revalidatePath("/home");
  revalidatePath("/plan");
  return { success: true, data: newTask };
}

export async function toggleTaskStatusAction(taskId: string, currentStatus: TaskStatus) {
  const nextStatus: TaskStatus = currentStatus === "done" ? "todo" : "done";
  const completedAt = nextStatus === "done" ? new Date().toISOString() : null;

  const supabase = await getSupabaseSafe();
  if (supabase) {
    await (supabase as any).from("tasks").update({
      status: nextStatus,
      completed_at: completedAt,
    }).eq("id", taskId);
  } else {
    const task = SEED_TASKS.find((t) => t.id === taskId);
    if (task) {
      task.status = nextStatus;
      task.completed_at = completedAt;
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/home");
  revalidatePath("/plan");
  return { success: true, nextStatus };
}

export async function toggleTaskMyDayAction(taskId: string, currentIsMyDay: boolean) {
  const nextVal = !currentIsMyDay;
  const supabase = await getSupabaseSafe();
  if (supabase) {
    await (supabase as any).from("tasks").update({ is_my_day: nextVal }).eq("id", taskId);
  } else {
    const task = SEED_TASKS.find((t) => t.id === taskId);
    if (task) task.is_my_day = nextVal;
  }

  revalidatePath("/tasks");
  revalidatePath("/home");
  revalidatePath("/plan");
  return { success: true, nextVal };
}

// ==============================================================================
// 4. PLANNING ACTIONS
// ==============================================================================
export async function getDailyPlanAction(targetDate?: string): Promise<Plan> {
  const dateStr = targetDate || new Date().toISOString().split("T")[0];
  const ws = await getActiveWorkspace();
  const workspaceId = ws?.id || "demo-ws-1";

  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data } = await supabase
      .from("plans")
      .select("*, plan_items(*)")
      .eq("workspace_id", workspaceId)
      .eq("target_date", dateStr)
      .single();

    if (data) return data as Plan;
  }

  // Default initial daily plan
  return {
    id: "plan-today",
    workspace_id: workspaceId,
    user_id: "demo-user",
    type: "daily",
    target_date: dateStr,
    objective: "Establish Phase 1 Core OS: Connected loop across Home, Goals, Tasks, Plans, Projects & Calendar.",
    summary: "Prioritize deep work blocks for schema and UI execution, followed by team synchronization.",
    status: "active",
    metrics: {
      totalTimeBlocks: 4,
      priorityTasks: 3,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: "pi-1",
        plan_id: "plan-today",
        task_id: "t-1",
        title: "Deep Work: Core OS Schema & RLS Policies",
        time_block: "09:30 - 11:30",
        is_completed: true,
        priority: "urgent",
        order_index: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: "pi-2",
        plan_id: "plan-today",
        task_id: "t-2",
        title: "Goals & Progress Tracking Interface",
        time_block: "13:00 - 15:30",
        is_completed: false,
        priority: "high",
        order_index: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: "pi-3",
        plan_id: "plan-today",
        task_id: "t-3",
        title: "Unified Calendar & Interactive Tasks",
        time_block: "16:00 - 18:00",
        is_completed: false,
        priority: "medium",
        order_index: 2,
        created_at: new Date().toISOString(),
      },
    ],
  };
}

export async function createPlanAction(formData: FormData) {
  const ws = await getActiveWorkspace();
  const workspaceId = ws?.id || "demo-ws-1";

  const raw = {
    workspaceId,
    type: formData.get("type") || "daily",
    targetDate: formData.get("targetDate") || new Date().toISOString().split("T")[0],
    objective: formData.get("objective"),
    summary: formData.get("summary") || undefined,
  };

  const parsed = createPlanSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  revalidatePath("/plan");
  revalidatePath("/home");
  return { success: true };
}

// ==============================================================================
// 5. CALENDAR ACTIONS
// ==============================================================================
export async function getCalendarEventsAction(workspaceId?: string): Promise<CalendarEvent[]> {
  const ws = workspaceId ? { id: workspaceId } : await getActiveWorkspace();
  const targetWsId = ws?.id || "demo-ws-1";

  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data } = await supabase
      .from("calendar_events")
      .select("*, tasks(title), projects(name, color)")
      .eq("workspace_id", targetWsId)
      .order("start_time", { ascending: true });

    if (data && data.length > 0) {
      return data as CalendarEvent[];
    }
  }

  return SEED_CALENDAR.filter((e) => e.workspace_id === targetWsId || targetWsId === "demo-ws-1");
}

export async function createCalendarEventAction(formData: FormData) {
  const ws = await getActiveWorkspace();
  const workspaceId = ws?.id || "demo-ws-1";

  const raw = {
    workspaceId,
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    allDay: formData.get("allDay") === "true",
    eventType: formData.get("eventType") || "event",
    color: formData.get("color") || "#7C3AED",
  };

  const parsed = createCalendarEventSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("calendar_events").insert({
      workspace_id: workspaceId,
      title: parsed.data.title,
      description: parsed.data.description,
      start_time: parsed.data.startTime,
      end_time: parsed.data.endTime,
      all_day: parsed.data.allDay,
      event_type: parsed.data.eventType,
      color: parsed.data.color,
    } as any).select().single();

    if (error) return { success: false, message: error.message };
    revalidatePath("/calendar");
    revalidatePath("/home");
    return { success: true, data };
  }

  const newEvent: CalendarEvent = {
    id: `e-${Date.now()}`,
    workspace_id: workspaceId,
    user_id: "demo-user",
    title: parsed.data.title,
    description: parsed.data.description || null,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    all_day: parsed.data.allDay,
    event_type: parsed.data.eventType,
    task_id: null,
    project_id: null,
    color: parsed.data.color,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  SEED_CALENDAR.push(newEvent);

  revalidatePath("/calendar");
  revalidatePath("/home");
  return { success: true, data: newEvent };
}

// ==============================================================================
// 6. HOME COMMAND CENTER COMPOSITE QUERY
// ==============================================================================
export async function getHomeDashboardDataAction() {
  const ws = await getActiveWorkspace();
  const workspaceId = ws?.id || "demo-ws-1";

  const [goals, projects, tasks, plan, events] = await Promise.all([
    getGoalsAction(workspaceId),
    getProjectsAction(workspaceId),
    getTasksAction(workspaceId),
    getDailyPlanAction(),
    getCalendarEventsAction(workspaceId),
  ]);

  const todayTasks = tasks.filter((t) => t.is_my_day || t.status === "todo");
  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    return new Date(t.due_date).getTime() < Date.now() - 86400000;
  });
  const completedTasks = tasks.filter((t) => t.status === "done");

  return {
    workspace: ws,
    goals,
    projects,
    tasks,
    todayTasks,
    overdueTasks,
    completedTasksCount: completedTasks.length,
    plan,
    events,
  };
}
