"use client";

import * as React from "react";
import {
  Target,
  Plus,
  Sparkles,
  FolderGit2,
  CheckCircle2,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getGoalsAction, createGoalAction } from "@/actions/core-os";
import type { Goal, GoalTimeframe, PriorityLevel } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [timeframe, setTimeframe] = React.useState<GoalTimeframe>("quarter");
  const [priority, setPriority] = React.useState<PriorityLevel>("medium");
  const [targetValue, setTargetValue] = React.useState("100");
  const [currentValue, setCurrentValue] = React.useState("0");
  const [unit, setUnit] = React.useState("%");
  const [deadline, setDeadline] = React.useState("");

  const loadGoals = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGoalsAction();
      setGoals(data);
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const filteredGoals = React.useMemo(() => {
    if (selectedTimeframe === "all") return goals;
    return goals.filter((g) => g.timeframe === selectedTimeframe);
  }, [goals, selectedTimeframe]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    formData.append("timeframe", timeframe);
    formData.append("priority", priority);
    formData.append("targetValue", targetValue);
    formData.append("currentValue", currentValue);
    formData.append("unit", unit);
    if (deadline) formData.append("deadline", deadline);

    try {
      const res = await createGoalAction(formData);
      if (res.success) {
        toast.success("Goal established successfully");
        setIsCreateOpen(false);
        setTitle("");
        setDescription("");
        setDeadline("");
        loadGoals();
      } else {
        toast.error("Failed to create goal");
      }
    } catch {
      toast.error("An unexpected error occurred");
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
              <Target className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Goals System</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Hierarchical alignment: Vision → Year → Quarter → Month → Execution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2 text-xs">
            <Plus className="h-4 w-4" />
            <span>New Goal</span>
          </Button>
        </div>
      </div>

      {/* Timeframe Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All Goals</TabsTrigger>
            <TabsTrigger value="year">Yearly</TabsTrigger>
            <TabsTrigger value="quarter">Quarterly</TabsTrigger>
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="vision">Vision</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Progress auto-calculated from measurable targets</span>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs">Loading workspace goals...</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        <Card className="border-dashed p-10 text-center space-y-3">
          <Target className="h-8 w-8 text-muted-foreground/70 mx-auto" />
          <h3 className="font-semibold text-sm">No goals in this timeframe</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Set ambitious targets and break them down into measurable quarterly and monthly milestones.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} size="sm" variant="outline" className="text-xs">
            Create First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current_value / (goal.target_value || 1)) * 100));
            return (
              <Card key={goal.id} className="border-border/80 hover:border-primary/40 transition-colors flex flex-col justify-between">
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {goal.timeframe}
                    </Badge>
                    <Badge
                      variant={
                        goal.priority === "urgent"
                          ? "destructive"
                          : goal.priority === "high"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[10px] capitalize"
                    >
                      {goal.priority}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold leading-snug">{goal.title}</CardTitle>
                    {goal.description && (
                      <CardDescription className="text-xs line-clamp-2 mt-1">
                        {goal.description}
                      </CardDescription>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Measurable Progress Bar */}
                  <div className="space-y-1.5 bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Target progress</span>
                      <span className="font-semibold font-mono text-foreground">
                        {goal.current_value} / {goal.target_value} {goal.unit} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Connected OS links */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <FolderGit2 className="h-3 w-3 text-primary" />
                        {goal.projects_count ?? 1} projects
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        {goal.tasks_count ?? 4} tasks
                      </span>
                    </div>
                    {goal.deadline && (
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" />
                        {goal.deadline}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Define your objective and attach measurable milestone targets.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Goal Title</label>
              <Input
                placeholder="e.g. Achieve 1,000 Active Users"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Description</label>
              <textarea
                placeholder="Strategic context, why it matters, and outcome criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as GoalTimeframe)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="year">Yearly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="month">Monthly</option>
                  <option value="week">Weekly</option>
                  <option value="vision">Long-term Vision</option>
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

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Current</label>
                <Input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Target</label>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Unit</label>
                <Input
                  placeholder="%, users, $"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Target Deadline</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isSubmitting}
              />
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
                    Saving...
                  </>
                ) : (
                  "Create Goal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
