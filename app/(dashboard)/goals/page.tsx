import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GoalsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Target className="h-6 w-6 text-primary" />
            <span>Goals System</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vision → Year → Quarter → Month goal hierarchy and progress tracking.
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Personal OS Launch", period: "2026 Q4", progress: 65, status: "Active" },
          { title: "CertiLayer Scale", period: "2026 Annual", progress: 40, status: "In Progress" },
          { title: "Knowledge Base Consolidation", period: "November", progress: 20, status: "On Track" },
        ].map((goal, i) => (
          <Card key={i} className="border-border/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">{goal.period}</Badge>
                <Badge variant="success" className="text-[10px]">{goal.status}</Badge>
              </div>
              <CardTitle className="text-base mt-2">{goal.title}</CardTitle>
              <CardDescription className="text-xs">Connected to 3 projects and 12 tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-semibold text-foreground">{goal.progress}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
