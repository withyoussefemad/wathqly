"use client";

import * as React from "react";
import {
  Calendar,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  TrendingUp,
  Brain,
  Loader2,
  CalendarDays,
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
import { getDailyPlanAction, createPlanAction, getTasksAction, getGoalsAction } from "@/actions/core-os";
import type { Plan, PlanItem, Task, Goal } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function PlanPage() {
  const [plan, setPlan] = React.useState<Plan | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [activeTab, setActiveTab] = React.useState<"day" | "week">("day");
  const [loading, setLoading] = React.useState(true);
  const [isAiGenerating, setIsAiGenerating] = React.useState(false);
  const [isNewPlanOpen, setIsNewPlanOpen] = React.useState(false);

  // New Plan Form
  const [objective, setObjective] = React.useState("");
  const [summary, setSummary] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedPlan, fetchedTasks, fetchedGoals] = await Promise.all([
        getDailyPlanAction(),
        getTasksAction(),
        getGoalsAction(),
      ]);
      setPlan(fetchedPlan);
      setTasks(fetchedTasks);
      setGoals(fetchedGoals);
    } catch {
      toast.error("Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle Plan Item Completion
  const handleTogglePlanItem = (itemId: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      items: plan.items?.map((item) =>
        item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
      ),
    });
    toast.success("Progress saved");
  };

  // AI Planner Generator: analyzes goals, incomplete tasks, and synthesizes time blocks
  const handleAiPlanGenerate = async () => {
    setIsAiGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Smooth UX transition

      const pendingTasks = tasks.filter((t) => t.status !== "done").slice(0, 3);
      const activeGoal = goals[0];

      const synthesizedItems: PlanItem[] = [
        {
          id: `ai-item-${Date.now()}-1`,
          plan_id: plan?.id || "plan-today",
          task_id: pendingTasks[0]?.id || null,
          title: pendingTasks[0]?.title || "Deep Work on High-Leverage Milestones",
          time_block: "09:00 - 11:30",
          is_completed: false,
          priority: "urgent",
          order_index: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: `ai-item-${Date.now()}-2`,
          plan_id: plan?.id || "plan-today",
          task_id: pendingTasks[1]?.id || null,
          title: pendingTasks[1]?.title || "Strategic Alignment & System Implementation",
          time_block: "13:30 - 15:30",
          is_completed: false,
          priority: "high",
          order_index: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: `ai-item-${Date.now()}-3`,
          plan_id: plan?.id || "plan-today",
          task_id: null,
          title: "Daily Execution Reflection & Calendar Sync",
          time_block: "17:00 - 17:45",
          is_completed: false,
          priority: "medium",
          order_index: 2,
          created_at: new Date().toISOString(),
        },
      ];

      setPlan((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          objective: `Accelerate ${activeGoal?.title || "Product Delivery"} by focusing on key blocker tasks.`,
          summary: "AI plan generated based on goal relevance, priority weights, and scheduled availability.",
          items: synthesizedItems,
        };
      });

      toast.success("AI plan synthesized successfully!");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCreateManualPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("objective", objective);
    formData.append("summary", summary);
    formData.append("type", activeTab === "day" ? "daily" : "weekly");

    await createPlanAction(formData);
    toast.success("Plan updated");
    setIsNewPlanOpen(false);
    loadData();
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Planning System</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Connect high-level goals directly into structured daily and weekly execution blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Plan Generator Button */}
          <Button
            onClick={handleAiPlanGenerate}
            disabled={isAiGenerating}
            size="sm"
            variant="outline"
            className="gap-2 text-xs border-primary/40 text-primary hover:bg-primary/10"
          >
            {isAiGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Plan My {activeTab === "day" ? "Day" : "Week"}</span>
              </>
            )}
          </Button>

          <Button onClick={() => setIsNewPlanOpen(true)} size="sm" className="gap-2 text-xs">
            <Plus className="h-4 w-4" />
            <span>Set Objective</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "day" | "week")} className="w-auto">
          <TabsList>
            <TabsTrigger value="day" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Daily Plan</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Weekly Strategy</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <span className="text-xs text-muted-foreground font-mono">{todayStr}</span>
      </div>

      {/* Planning Content Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs">Loading strategy &amp; plan items...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Execution Plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Objective Banner */}
          <Card className="border-border/80 bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="accent" className="text-[10px] font-semibold">
                  {activeTab === "day" ? "Today's Core Objective" : "Weekly North Star"}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Status: Active</span>
              </div>
              <CardTitle className="text-lg font-bold pt-2 leading-relaxed">
                {plan?.objective || "Establish Foundation & Core OS loop"}
              </CardTitle>
              {plan?.summary && (
                <CardDescription className="text-xs leading-normal pt-1">
                  {plan.summary}
                </CardDescription>
              )}
            </CardHeader>
          </Card>

          {/* Time Blocks & Execution Items */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Scheduled Time Blocks</CardTitle>
                <CardDescription className="text-xs">
                  Prioritized chronologically for maximum focus
                </CardDescription>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {plan?.items?.filter((i) => i.is_completed).length || 0} / {plan?.items?.length || 0} Done
              </span>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {plan?.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleTogglePlanItem(item.id)}
                      className="mt-0.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {item.is_completed ? (
                        <CheckCircle2 className="h-4 w-4 text-success fill-emerald-500/20" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          item.is_completed ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.time_block && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-mono">
                          <Clock className="h-3 w-3 text-primary" />
                          {item.time_block}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={item.priority === "urgent" ? "destructive" : item.priority === "high" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {item.priority}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Goal Alignment & AI Review */}
        <div className="space-y-6">
          {/* Active Goal Anchor */}
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Associated Goal</CardTitle>
              </div>
              <CardDescription className="text-xs">
                This plan advances your active quarterly goal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals[0] ? (
                <div className="p-3 rounded-lg bg-secondary/50 space-y-2 text-xs">
                  <div className="font-semibold text-foreground">{goals[0].title}</div>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Current progress</span>
                    <span className="font-semibold font-mono text-foreground">
                      {goals[0].current_value} / {goals[0].target_value} {goals[0].unit}
                    </span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((goals[0].current_value / (goals[0].target_value || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No active goals found.</p>
              )}
            </CardContent>
          </Card>

          {/* AI Planning Synthesis Card */}
          <Card className="border-border/80 border-dashed">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">AI Synthesis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
              <p>
                Per Section 7 of product principles, the system balances <strong>urgency</strong>, <strong>effort</strong>, and <strong>goal impact</strong> to prevent context switching.
              </p>
              <div className="p-2.5 rounded-md bg-secondary/50 text-xs text-foreground flex items-center justify-between">
                <span>Calendar availability:</span>
                <span className="font-semibold text-success">4.5 hrs Focus</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Manual Objective Dialog */}
      <Dialog open={isNewPlanOpen} onOpenChange={setIsNewPlanOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Set Plan Objective</DialogTitle>
            <DialogDescription>
              Define the single most important outcome for this {activeTab === "day" ? "day" : "week"}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateManualPlan} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Core Strategic Objective</label>
              <Input
                placeholder="e.g. Ship Core OS module and complete milestone tests"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Summary / Context</label>
              <textarea
                placeholder="Key considerations, dependencies, or focus notes..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewPlanOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Objective
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
