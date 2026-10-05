import { Bot, Sparkles, Brain, History, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AIPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Bot className="h-6 w-6 text-primary" />
            <span>AI Core &amp; Intelligence</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System intelligence layer, long-term memory, retrieval-augmented queries, and automated synthesis.
          </p>
        </div>
        <Badge variant="accent" className="h-7 px-3 text-xs gap-1.5 font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          AI System Layer
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">AI Memory</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Context and long-term memory extracted across workspace documents and plans.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="p-2.5 rounded-md bg-secondary/50">
              <p className="font-medium text-foreground">User Preferences</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">Prefers concise reviews, CertiLayer purple accents, modular monoliths.</p>
            </div>
            <div className="p-2.5 rounded-md bg-secondary/50">
              <p className="font-medium text-foreground">Work Style</p>
              <p className="text-muted-foreground text-[11px] mt-0.5">Primary execution loop: Capture → Organize → Plan → Execute.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base font-semibold">Recent AI Activity</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Audit log of AI tool executions and recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="p-2.5 rounded-md border border-border/50">
              <span className="font-medium text-foreground">Foundation Schema Validation</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">Verified RLS policies and workspace foreign key integrity.</p>
            </div>
            <div className="p-2.5 rounded-md border border-border/50">
              <span className="font-medium text-foreground">Daily Briefing Synthesis</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">Prepared today&apos;s morning priority recommendations.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-base font-semibold">Security &amp; Permissions</CardTitle>
            </div>
            <CardDescription className="text-xs">
              AI sandbox boundaries and permission isolation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground">
            <p>
              Per Section 28 &amp; 43: AI operations execute within explicit user workspace permissions and cannot bypass RLS.
            </p>
            <div className="p-2.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px]">
              Workspace Isolation Active
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
