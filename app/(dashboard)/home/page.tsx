"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  FolderGit2,
  Calendar,
  Sparkles,
  Plus,
  Circle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Zap,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { getHomeDashboardDataAction, toggleTaskStatusAction } from "@/actions/core-os";
import { getCrmStatsAction } from "@/actions/crm";
import { getMeetingsAction } from "@/actions/meetings";
import type { Task, Goal, Project, CalendarEvent, Meeting } from "@/lib/supabase/types";
import { Users2, Video } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const { currentWorkspace, profile } = useWorkspace();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [crmStats, setCrmStats] = React.useState<{ totalPipelineValue: number; totalWonValue: number; openDealsCount: number; pendingActivities: number } | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = React.useState<Meeting[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [data, stats, meetings] = await Promise.all([
        getHomeDashboardDataAction(),
        getCrmStatsAction(),
        getMeetingsAction(),
      ]);
      setTasks(data.tasks);
      setGoals(data.goals);
      setProjects(data.projects);
      setEvents(data.events);
      setCrmStats(stats);
      setUpcomingMeetings(meetings.slice(0, 3));
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Task check-off handler
  const handleToggleTask = async (task: Task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t
      )
    );
    const res = await toggleTaskStatusAction(task.id, task.status);
    if (!res.success) {
      toast.error("Failed to update status");
      loadData();
    } else {
      toast.success(task.status === "done" ? "Task reopened" : "Task completed!");
    }
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const todayTasks = tasks.filter((t) => t.is_my_day || t.status === "todo");
  const completedTasks = tasks.filter((t) => t.status === "done");
  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "done") return false;
    return new Date(t.due_date).getTime() < Date.now() - 86400000;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Greeting & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{todayStr}</span>
            <span>•</span>
            <span className="text-primary font-medium">{currentWorkspace?.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Youssef"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your connected daily command center: Goal → Plan → Project → Tasks → Calendar → Execution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/notes">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Capture Note</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/plan">
              <Calendar className="h-3.5 w-3.5" />
              <span>Daily Plan</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs">
            <Link href="/tasks">
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* AI System Briefing Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary font-medium">
                AI System Synthesis
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/30 text-primary">
                Connected Core OS
              </Badge>
            </div>
            <p className="text-sm text-foreground/90 leading-snug">
              {completedTasks.length} tasks completed today across {projects.length} active roadmap initiatives.
              Focus on high-priority items aligned with your active quarterly targets.
            </p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs text-primary hover:text-primary gap-1 shrink-0">
          <Link href="/plan">
            Review Today&apos;s Strategy
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Overdue alert if any */}
      {overdueTasks.length > 0 && (
        <div className="p-3.5 rounded-lg border border-warning/30 bg-warning/10 flex items-center justify-between text-xs text-warning">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span>
              You have <strong>{overdueTasks.length} overdue task(s)</strong> requiring attention.
            </span>
          </div>
          <Button asChild variant="outline" size="sm" className="h-7 text-xs border-warning/30">
            <Link href="/tasks">Resolve in Tasks</Link>
          </Button>
        </div>
      )}

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today&apos;s Focus</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {completedTasks.length} / {tasks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}% completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{goals.length}</div>
            <p className="text-xs text-success mt-1">
              Advancing quarterly targets
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Projects</CardTitle>
            <FolderGit2 className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{projects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Roadmap initiatives
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today&apos;s Events</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{events.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled blocks &amp; meetings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Priorities & Active Projects (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Priorities with interactive checkbox */}
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Today&apos;s Priorities</CardTitle>
                <CardDescription className="text-xs">
                  Highest-leverage tasks for immediate execution
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/tasks">View all tasks</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {loading ? (
                <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading priorities...</span>
                </div>
              ) : todayTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-success mx-auto" />
                  <p>All caught up! No tasks pending for today.</p>
                </div>
              ) : (
                todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                      >
                        {task.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4 text-success fill-emerald-500/20" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                      <span
                        className={`text-xs font-medium ${
                          task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "default" : "secondary"}
                        className="text-[10px] capitalize"
                      >
                        {task.priority}
                      </Badge>
                      {task.estimated_minutes && (
                        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.estimated_minutes}m
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Projects Widget */}
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Active Projects</CardTitle>
                <CardDescription className="text-xs">Current roadmap progress</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/projects">View projects</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects.map((p) => {
                const total = p.tasks_total || 5;
                const done = p.tasks_done || 3;
                const progress = Math.round((done / total) * 100);
                return (
                  <div key={p.id} className="p-3 rounded-lg border border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize font-mono">
                        {p.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: p.color }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{done} of {total} deliverables completed</span>
                      <span className="font-mono font-medium text-foreground">{progress}%</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Goal Progress & Today's Schedule (Span 1) */}
        <div className="space-y-6">
          {/* Goal Progress Widget */}
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Goal Progress</CardTitle>
                <CardDescription className="text-xs">Measurable quarterly milestones</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/goals">Goals</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.map((goal) => {
                const pct = Math.min(100, Math.round((goal.current_value / (goal.target_value || 1)) * 100));
                return (
                  <div key={goal.id} className="p-2.5 rounded-lg bg-secondary/30 space-y-1.5 border border-border/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate">{goal.title}</span>
                      <span className="font-mono font-semibold text-primary">{pct}%</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Today's Schedule Widget */}
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/calendar">Calendar</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.slice(0, 3).map((event) => {
                const dateObj = new Date(event.start_time);
                const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={event.id} className="flex items-start gap-3 text-xs">
                    <div className="font-mono text-muted-foreground text-xs w-14 shrink-0 pt-0.5">
                      {timeStr}
                    </div>
                    <div
                      className="flex-1 pb-3 border-l-2 pl-3"
                      style={{ borderColor: event.color }}
                    >
                      <p className="font-medium text-foreground">{event.title}</p>
                      <Badge variant="secondary" className="text-[9px] mt-1 capitalize font-normal">
                        {event.event_type}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Business & Sales Pipeline Widget */}
          {crmStats && (
            <Card className="border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold">Business &amp; Pipeline</CardTitle>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href="/crm">CRM</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Value</span>
                    <p className="font-mono font-bold text-foreground text-sm mt-0.5">
                      ${crmStats.totalPipelineValue.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-muted-foreground">{crmStats.openDealsCount} deals</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/40">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Won Revenue</span>
                    <p className="font-mono font-bold text-success text-sm mt-0.5">
                      ${crmStats.totalWonValue.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-muted-foreground">Closed contracts</span>
                  </div>
                </div>

                {upcomingMeetings.length > 0 && (
                  <div className="pt-2 border-t border-border/40 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <Video className="h-3 w-3 text-primary" />
                        <span>Upcoming Meetings</span>
                      </span>
                      <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 text-xs">
                        <Link href="/meetings">All</Link>
                      </Button>
                    </div>
                    {upcomingMeetings.map((m) => (
                      <div key={m.id} className="text-xs p-2 rounded-md bg-secondary/20 flex items-center justify-between">
                        <span className="font-medium text-foreground truncate max-w-[170px]">{m.title}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(m.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Connected OS Product Loop Principle */}
          <Card className="border-border/80 bg-secondary/20 border-dashed">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Zap className="h-3.5 w-3.5" />
                <span>Connected Core Loop</span>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <p className="font-mono">
                Goal → Plan → Project → Tasks → Knowledge → CRM → Calendar
              </p>
              <p className="pt-1">
                Every action taken directly updates measurable progress across all associated modules.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
