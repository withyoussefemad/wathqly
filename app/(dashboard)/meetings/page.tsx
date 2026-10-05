import { Video, Plus, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MeetingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Video className="h-6 w-6 text-primary" />
            <span>Meetings</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agenda preparation, action items, attendee tracking, and AI summaries.
          </p>
        </div>
        <Button size="sm" className="gap-2 text-xs">
          <Plus className="h-4 w-4" />
          <span>Schedule Meeting</span>
        </Button>
      </div>

      <Card className="border-border/80">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">Upcoming &amp; Past Meetings</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {[
            { title: "Weekly Execution Sync", date: "Today, 5:00 PM", duration: "30m", attendees: "3 participants", status: "Upcoming" },
            { title: "Architecture & Supabase Strategy", date: "Yesterday, 2:00 PM", duration: "45m", attendees: "2 participants", status: "Completed" },
          ].map((m, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{m.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{m.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.duration}</span>
                  <span>{m.attendees}</span>
                </div>
              </div>
              <Badge variant={m.status === "Upcoming" ? "accent" : "secondary"} className="text-xs">
                {m.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
