import { FileText, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function NotesPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-primary" />
            <span>Notes &amp; Thoughts</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture thoughts, meeting notes, research, and technical documentation.
          </p>
        </div>
        <Button size="sm" className="gap-2 text-xs">
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search notes..." className="pl-9 text-xs" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Modular Monolith Architecture", tag: "Engineering", date: "2 hours ago", preview: "Guidelines on domain boundaries, avoiding microservices early, and strict database isolation..." },
          { title: "Connected OS Data Principles", tag: "Product", date: "Yesterday", preview: "Goal -> Plan -> Project -> Tasks -> Calendar -> Execution loop explained..." },
          { title: "CertiLayer Purple Palette Tokens", tag: "Design", date: "Oct 4", preview: "Tokens for #7C3AED accent, neutral dark/light surfaces, minimal borders..." },
        ].map((note, i) => (
          <Card key={i} className="border-border/80 hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">{note.tag}</Badge>
                <span className="text-[11px] text-muted-foreground">{note.date}</span>
              </div>
              <CardTitle className="text-base mt-2">{note.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-3">{note.preview}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
