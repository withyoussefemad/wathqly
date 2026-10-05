import { PenTool, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WhiteboardsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <PenTool className="h-6 w-6 text-primary" />
            <span>Whiteboards &amp; Mind Maps</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Custom-built spatial canvas engine for infinite ideas, diagrams, and connected thinking.
          </p>
        </div>
        <Button size="sm" className="gap-2 text-xs" disabled>
          <Plus className="h-4 w-4" />
          <span>New Whiteboard</span>
        </Button>
      </div>

      <Card className="border-border/80 border-dashed bg-card/50">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <PenTool className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Phase 4 — Creative Engine
            </Badge>
            <CardTitle className="text-lg">Custom Whiteboard Engine</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Per architectural rule #17 and Section 54 build order, custom whiteboard data models and canvas rendering are isolated and will be implemented in Phase 4 once the core data model and workspace authorization are fully stable.
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
