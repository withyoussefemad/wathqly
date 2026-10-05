import { Plus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ContentPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Share2 className="h-6 w-6 text-primary" />
            <span>Content Pipeline</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ideas, drafts, publishing calendar, and multichannel content distribution.
          </p>
        </div>
        <Button size="sm" className="gap-2 text-xs">
          <Plus className="h-4 w-4" />
          <span>New Content Item</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { title: "Building an AI-native Personal OS", platform: "X & LinkedIn", stage: "Drafting", date: "Oct 8" },
          { title: "Why Modular Monoliths Win", platform: "Technical Blog", stage: "Idea", date: "Oct 15" },
          { title: "CertiLayer Product Vision & Architecture", platform: "Substack", stage: "Scheduled", date: "Oct 10" },
        ].map((item, idx) => (
          <Card key={idx} className="border-border/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">{item.platform}</Badge>
                <Badge variant={item.stage === "Scheduled" ? "success" : "outline"} className="text-[10px]">{item.stage}</Badge>
              </div>
              <CardTitle className="text-base mt-2">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40 flex justify-between">
                <span>Target Date</span>
                <span className="font-mono text-foreground">{item.date}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
