"use client";

import * as React from "react";
import {
  CheckSquare,
  Plus,
  Sun,
  Kanban,
  List,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getTasksAction,
  createTaskAction,
  toggleTaskStatusAction,
  toggleTaskMyDayAction,
  getProjectsAction,
} from "@/actions/core-os";
import type { Task, Project, PriorityLevel, TaskStatus } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"my-day" | "list" | "board">("my-day");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [quickTitle, setQuickTitle] = React.useState("");

  // Detailed Modal form
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>("");
  const [priority, setPriority] = React.useState<PriorityLevel>("medium");
  const [dueDate, setDueDate] = React.useState("");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState("");
  const [isMyDay, setIsMyDay] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedTasks, fetchedProjects] = await Promise.all([
        getTasksAction(),
        getProjectsAction(),
      ]);
      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Quick Create Inline
  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const formData = new FormData();
    formData.append("title", quickTitle);
    formData.append("isMyDay", viewMode === "my-day" ? "true" : "false");

    setQuickTitle("");
    const res = await createTaskAction(formData);
    if (res.success) {
      toast.success("Task created");
      loadData();
    } else {
      toast.error("Failed to create task");
    }
  };

  // Toggle status
  const handleToggleStatus = async (task: Task) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: t.status === "done" ? "todo" : "done" }
          : t
      )
    );

    const res = await toggleTaskStatusAction(task.id, task.status);
    if (!res.success) {
      toast.error("Failed to update status");
      loadData();
    }
  };

  // Toggle My Day
  const handleToggleMyDay = async (task: Task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, is_my_day: !t.is_my_day } : t
      )
    );
    await toggleTaskMyDayAction(task.id, task.is_my_day);
  };

  // Detailed Modal Create
  const handleDetailedCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (projectId) formData.append("projectId", projectId);
    formData.append("priority", priority);
    if (dueDate) formData.append("dueDate", dueDate);
    if (estimatedMinutes) formData.append("estimatedMinutes", estimatedMinutes);
    formData.append("isMyDay", isMyDay ? "true" : "false");

    try {
      const res = await createTaskAction(formData);
      if (res.success) {
        toast.success("Task created successfully");
        setIsCreateOpen(false);
        setTitle("");
        setDescription("");
        setDueDate("");
        setEstimatedMinutes("");
        loadData();
      } else {
        toast.error("Failed to create task");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tasks based on view mode
  const displayedTasks = React.useMemo(() => {
    if (viewMode === "my-day") {
      return tasks.filter((t) => t.is_my_day);
    }
    return tasks;
  }, [tasks, viewMode]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Action items directly connected to daily plans, goals, and project roadmaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2 text-xs">
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* View Switcher & Quick Add */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "my-day" | "list" | "board")} className="w-auto">
          <TabsList>
            <TabsTrigger value="my-day" className="gap-1.5">
              <Sun className="h-3.5 w-3.5 text-warning" />
              <span>My Day</span>
              <span className="ml-1 text-[10px] bg-secondary px-1.5 rounded-full font-mono">
                {tasks.filter((t) => t.is_my_day).length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              <span>All Tasks</span>
              <span className="ml-1 text-[10px] bg-secondary px-1.5 rounded-full font-mono">
                {tasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="board" className="gap-1.5">
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban Board</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Quick inline task creator */}
        <form onSubmit={handleQuickCreate} className="flex-1 max-w-md">
          <div className="relative">
            <Plus className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={viewMode === "my-day" ? "Add a task to My Day... (press Enter)" : "Add a task... (press Enter)"}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="pl-9 text-xs h-9 bg-secondary/40 border-border/60"
            />
          </div>
        </form>
      </div>

      {/* Main View Render */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs">Loading tasks...</p>
        </div>
      ) : viewMode === "board" ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["todo", "in_progress", "done"] as TaskStatus[]).map((status) => {
            const colTasks = tasks.filter((t) => t.status === status);
            const statusLabel =
              status === "todo" ? "To Do" : status === "in_progress" ? "In Progress" : "Completed";
            return (
              <div key={status} className="space-y-3 bg-secondary/20 p-4 rounded-xl border border-border/60">
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                  <span className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                    {statusLabel}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {colTasks.length}
                  </Badge>
                </div>

                <div className="space-y-2.5 min-h-[300px]">
                  {colTasks.map((t) => (
                    <Card key={t.id} className="p-3 border-border/80 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => handleToggleStatus(t)}
                            className="mt-0.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            {t.status === "done" ? (
                              <CheckCircle2 className="h-4 w-4 text-success fill-emerald-500/20" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <div>
                            <p className={`text-xs font-medium ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {t.title}
                            </p>
                            {t.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleMyDay(t)}
                          className={`p-1 rounded hover:bg-secondary cursor-pointer ${
                            t.is_my_day ? "text-warning" : "text-muted-foreground/70 hover:text-muted-foreground"
                          }`}
                        >
                          <Sun className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                        <Badge
                          variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {t.priority}
                        </Badge>
                        {t.estimated_minutes && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {t.estimated_minutes}m
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / My Day View */
        <Card className="border-border/80">
          <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">
                {viewMode === "my-day" ? "Today's Focus List" : "All Workspace Tasks"}
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                {displayedTasks.length}
              </Badge>
            </div>
            {viewMode === "my-day" && (
              <span className="text-xs text-muted-foreground">
                Tasks reset daily to maintain focus
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {displayedTasks.length === 0 ? (
              <div className="p-10 text-center space-y-2 text-muted-foreground">
                <CheckSquare className="h-7 w-7 mx-auto text-muted-foreground/70" />
                <p className="text-xs font-medium">No tasks found</p>
                <p className="text-xs">Use the quick input above to add your first task.</p>
              </div>
            ) : (
              displayedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 hover:bg-secondary/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                    >
                      {task.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-success fill-emerald-500/20" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {task.estimated_minutes && (
                          <span className="flex items-center gap-0.5 font-mono">
                            <Clock className="h-3 w-3" />
                            {task.estimated_minutes}m
                          </span>
                        )}
                        {task.due_date && (
                          <span className="font-mono">
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleToggleMyDay(task)}
                      title={task.is_my_day ? "Remove from My Day" : "Add to My Day"}
                      className={`p-1.5 rounded-md hover:bg-secondary cursor-pointer ${
                        task.is_my_day
                          ? "text-warning bg-warning/10"
                          : "text-muted-foreground/60 hover:text-muted-foreground"
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                    </button>

                    <Badge
                      variant={
                        task.priority === "urgent"
                          ? "destructive"
                          : task.priority === "high"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[10px] capitalize"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Assign action items with priorities, project links, and duration estimates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDetailedCreate} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Task Title</label>
              <Input
                placeholder="e.g. Implement RLS policy verification"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Description</label>
              <textarea
                placeholder="Details, acceptance criteria, or execution notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Associated Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">No Project (Standalone)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Estimated Time (mins)</label>
                <Input
                  type="number"
                  placeholder="e.g. 45"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="modalIsMyDay"
                checked={isMyDay}
                onChange={(e) => setIsMyDay(e.target.checked)}
                className="accent-primary h-4 w-4"
              />
              <label htmlFor="modalIsMyDay" className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5">
                <Sun className="h-3.5 w-3.5 text-warning" />
                Add directly to My Day list
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
