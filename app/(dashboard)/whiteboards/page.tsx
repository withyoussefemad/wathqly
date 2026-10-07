import { PenTool, Sparkles } from "lucide-react";
import WhiteboardNative from "@/components/creative/whiteboard-native";
import { Badge } from "@/components/ui/badge";

const BOARD_ID = "00000000-0000-1000-8000-000000000010";

export default function WhiteboardsPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <PenTool className="h-6 w-6 text-primary" />
            <span>Whiteboards &amp; Mind Maps</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            A custom spatial canvas for architecture, connected thinking, and reusable creative templates.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary w-fit gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Phase 4 — Live creative engine
        </Badge>
      </div>

      <WhiteboardNative initialBoardId={BOARD_ID} />
    </div>
  );
}
