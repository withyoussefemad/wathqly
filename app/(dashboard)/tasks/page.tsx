import { CheckSquare, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TasksPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-primary" />
            <span>Tasks</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Action items connected directly to projects, goals, and daily plans.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
          <Button size="sm" className="gap-2 text-xs">
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      <Card className="border-border/80">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">Active Workspace Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {[
            { title: "Review Supabase schema & RLS policies", project: "Wathqly Foundation", priority: "High", due: "Today", completed: true },
            { title: "Configure App Shell navigation & theme tokens", project: "Frontend", priority: "High", due: "Today", completed: true },
            { title: "Implement AI Assistant retrieval abstraction", project: "AI Core", priority: "Medium", due: "Tomorrow", completed: false },
            { title: "Consolidate contacts and lead pipelines", project: "CRM", priority: "Low", due: "Oct 12", completed: false },
          ].map((task, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={task.completed} readOnly className="accent-primary h-4 w-4" />
                <div>
                  <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{task.project}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={task.priority === "High" ? "destructive" : "secondary"} className="text-[10px]">
                  {task.priority}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">{task.due}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
