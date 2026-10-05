import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PlanPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-primary" />
            <span>Planning System</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Today • This Week • This Month • Reviews &amp; Reflections
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New Daily Plan</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Today&apos;s Strategy</CardTitle>
              <Badge variant="accent">Active</Badge>
            </div>
            <CardDescription className="text-xs">Prioritized plan for today&apos;s execution cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/50 text-xs text-foreground space-y-1">
              <span className="font-semibold text-primary">Primary Objective:</span>
              <p className="text-muted-foreground">Establish Phase 0 Foundation architecture, Supabase schema &amp; RLS policies.</p>
            </div>
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time Blocks</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between p-2 rounded border border-border/50">
                  <span>09:00 - 12:00</span>
                  <span className="font-medium">Deep Work: Architecture &amp; Database</span>
                </div>
                <div className="flex justify-between p-2 rounded border border-border/50">
                  <span>14:00 - 16:30</span>
                  <span className="font-medium">Frontend &amp; App Shell Navigation</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Weekly Milestones</CardTitle>
            <CardDescription className="text-xs">Key outcomes planned for this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            {[
              { item: "Phase 0 Foundation completion", done: true },
              { item: "Supabase production project sync", done: true },
              { item: "Phase 1 Core OS scoping (Home, Goals, Plan)", done: false },
              { item: "Knowledge system markdown editor evaluation", done: false },
            ].map((m, idx) => (
              <div key={idx} className="flex items-center gap-2.5 p-2 rounded bg-secondary/40">
                <input type="checkbox" checked={m.done} readOnly className="accent-primary" />
                <span className={m.done ? "line-through text-muted-foreground" : "text-foreground font-medium"}>
                  {m.item}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
