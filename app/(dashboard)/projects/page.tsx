"use client";

import * as React from "react";
import {
  FolderGit2,
  Plus,
  Target,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getProjectsAction, createProjectAction, getGoalsAction } from "@/actions/core-os";
import type { Project, Goal, PriorityLevel } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [goalId, setGoalId] = React.useState("");
  const [priority, setPriority] = React.useState<PriorityLevel>("medium");
  const [color, setColor] = React.useState("#7C3AED");
  const [targetDate, setTargetDate] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedProjects, fetchedGoals] = await Promise.all([
        getProjectsAction(),
        getGoalsAction(),
      ]);
      setProjects(fetchedProjects);
      setGoals(fetchedGoals);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProjects = React.useMemo(() => {
    if (statusFilter === "all") return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);
    if (slug) formData.append("slug", slug);
    if (description) formData.append("description", description);
    if (goalId) formData.append("goalId", goalId);
    formData.append("priority", priority);
    formData.append("color", color);
    if (targetDate) formData.append("targetDate", targetDate);

    try {
      const res = await createProjectAction(formData);
      if (res.success) {
        toast.success("Project created successfully");
        setIsCreateOpen(false);
        setName("");
        setSlug("");
        setDescription("");
        setTargetDate("");
        loadData();
      } else {
        toast.error("Failed to create project");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects &amp; Roadmaps</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Connected execution spaces linking active goals to actionable tasks and roadmaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2 text-xs">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <span className="text-xs text-muted-foreground font-mono">
          {filteredProjects.length} active initiatives
        </span>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed p-10 text-center space-y-3">
          <FolderGit2 className="h-8 w-8 text-muted-foreground/50 mx-auto" />
          <h3 className="font-semibold text-sm">No projects found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create structured projects to organize your tasks, roadmaps, and goal deliverables.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} size="sm" variant="outline" className="text-xs">
            Create First Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const tasksTotal = project.tasks_total || 5;
            const tasksDone = project.tasks_done || 3;
            const progress = Math.round((tasksDone / tasksTotal) * 100);

            return (
              <Card
                key={project.id}
                className="border-border/80 hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <Badge variant="secondary" className="text-[10px] capitalize font-mono">
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <Badge
                      variant={
                        project.priority === "urgent"
                          ? "destructive"
                          : project.priority === "high"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[10px] capitalize"
                    >
                      {project.priority}
                    </Badge>
                  </div>

                  <div>
                    <CardTitle className="text-base font-semibold leading-snug">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="text-xs line-clamp-2 mt-1">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Task Completion Progress */}
                  <div className="space-y-1.5 bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Deliverables progress</span>
                      <span className="font-semibold font-mono text-foreground">
                        {tasksDone} / {tasksTotal} tasks ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </div>

                  {/* Connected Metadata */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <Target className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">
                        {goals.find((g) => g.id === project.goal_id)?.title || "Aligned to Core OS"}
                      </span>
                    </div>
                    {project.target_date && (
                      <span className="flex items-center gap-1 font-mono shrink-0 ml-2">
                        <Calendar className="h-3 w-3" />
                        {project.target_date}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Organize tasks and documentation under an overarching roadmap initiative.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Project Name</label>
              <Input
                placeholder="e.g. CertiLayer Enterprise Launch"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                }}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Slug / Identifier</label>
              <Input
                placeholder="certilayer-enterprise"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Description</label>
              <textarea
                placeholder="Scope, objectives, and deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Associated Goal</label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">No Goal (Independent)</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
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
                <label className="text-xs font-medium text-foreground">Target Date</label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Project Accent Color</label>
                <div className="flex items-center gap-2 pt-1">
                  {["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
                        color === c ? "scale-110 border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
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
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
