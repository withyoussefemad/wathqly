import { FolderGit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProjectsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FolderGit2 className="h-6 w-6 text-primary" />
            <span>Projects &amp; Roadmaps</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Execution initiatives connecting goals to operational tasks.
          </p>
        </div>
        <Button size="sm" className="gap-2 text-xs">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { title: "Wathqly Foundation (Phase 0)", desc: "Core repository, auth, Supabase schema, RLS, App Shell", tasks: "12/12", status: "Completed" },
          { title: "Core OS (Phase 1)", desc: "Home, Goals, Plans, Tasks, Projects & Calendar full data flow", tasks: "2/15", status: "Active" },
          { title: "Knowledge System (Phase 2)", desc: "Notes, Tiptap editor, backlinks, tags, documents", tasks: "0/10", status: "Planned" },
        ].map((proj, i) => (
          <Card key={i} className="border-border/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant={proj.status === "Completed" ? "success" : proj.status === "Active" ? "accent" : "secondary"}>
                  {proj.status}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">{proj.tasks} tasks</span>
              </div>
              <CardTitle className="text-base mt-2">{proj.title}</CardTitle>
              <CardDescription className="text-xs">{proj.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40 flex justify-between">
                <span>Workspace Scoped</span>
                <span className="text-primary font-medium">View details →</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
