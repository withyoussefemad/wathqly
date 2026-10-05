import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <span>Calendar</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Integrated schedule of tasks, events, milestones, and meeting commitments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md">
            <Button variant="ghost" size="icon-sm" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-xs px-2 font-medium">October 2026</span>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button size="sm" className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            <span>New Event</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 border border-border/80 rounded-lg p-4 bg-card">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center font-medium text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
        {Array.from({ length: 31 }).map((_, i) => (
          <div key={i} className="min-h-[85px] border border-border/40 rounded-md p-1.5 flex flex-col justify-between text-xs hover:border-primary/50 transition-colors">
            <span className="font-mono text-muted-foreground text-[10px]">{i + 1}</span>
            {i === 4 && (
              <Badge variant="accent" className="text-[9px] truncate">
                Foundation Launch
              </Badge>
            )}
            {i === 9 && (
              <Badge variant="secondary" className="text-[9px] truncate">
                Sprint Review
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
