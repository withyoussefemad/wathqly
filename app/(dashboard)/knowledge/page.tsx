import { BookOpen, FolderPlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function KnowledgePage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>Knowledge Base &amp; Files</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Wiki articles, research papers, files, and bookmarks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <FolderPlus className="h-3.5 w-3.5" />
            <span>New Folder</span>
          </Button>
          <Button size="sm" className="gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload File</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: "Product Specs", items: "8 documents", badge: "Wiki" },
          { name: "Architecture RFCs", items: "5 documents", badge: "Technical" },
          { name: "Legal & Corporate", items: "12 files", badge: "Files" },
          { name: "Design Guidelines", items: "4 documents", badge: "Design" },
        ].map((folder, i) => (
          <Card key={i} className="border-border/80 hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">{folder.badge}</Badge>
                <span className="text-[11px] text-muted-foreground">{folder.items}</span>
              </div>
              <CardTitle className="text-sm font-semibold mt-2">{folder.name}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
