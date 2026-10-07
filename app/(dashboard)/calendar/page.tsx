"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Video,
  Sparkles,
  Loader2,
  CalendarDays,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCalendarEventsAction, createCalendarEventAction } from "@/actions/core-os";
import type { CalendarEvent, CalendarEventType } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function CalendarPage() {
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<"month" | "agenda">("month");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [eventDate, setEventDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = React.useState("10:00");
  const [endTime, setEndTime] = React.useState("11:00");
  const [allDay] = React.useState(false);
  const [eventType, setEventType] = React.useState<CalendarEventType>("event");
  const [color, setColor] = React.useState("#7C3AED");

  const loadEvents = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCalendarEventsAction();
      setEvents(data);
    } catch {
      toast.error("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthYearStr = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate days in month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create Event Handler
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const startIso = `${eventDate}T${startTime}:00`;
    const endIso = `${eventDate}T${endTime}:00`;

    const formData = new FormData();
    formData.append("title", title);
    if (description) formData.append("description", description);
    formData.append("startTime", startIso);
    formData.append("endTime", endIso);
    formData.append("allDay", allDay ? "true" : "false");
    formData.append("eventType", eventType);
    formData.append("color", color);

    try {
      const res = await createCalendarEventAction(formData);
      if (res.success) {
        toast.success("Event scheduled successfully");
        setIsCreateOpen(false);
        setTitle("");
        setDescription("");
        loadEvents();
      } else {
        toast.error("Failed to create event");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendar &amp; Schedule</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Connect tasks, focus blocks, milestones, and meeting commitments in one unified view.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2 text-xs">
            <Plus className="h-4 w-4" />
            <span>New Event</span>
          </Button>
        </div>
      </div>

      {/* Calendar Controls & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border/80 rounded-md bg-secondary/30">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={prevMonth}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-semibold px-3 min-w-[130px] text-center font-mono">
              {monthYearStr}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={nextMonth}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-xs h-8"
          >
            Today
          </Button>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "agenda")} className="w-auto">
          <TabsList>
            <TabsTrigger value="month" className="gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Month</span>
            </TabsTrigger>
            <TabsTrigger value="agenda" className="gap-1.5">
              <List className="h-3.5 w-3.5" />
              <span>Agenda</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Calendar Views */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs">Loading calendar events...</p>
        </div>
      ) : viewMode === "month" ? (
        /* Month Grid */
        <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border/60 bg-secondary/30 text-center text-xs font-semibold text-muted-foreground py-2.5">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/40">
            {/* Blank offset days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[105px] p-2 bg-secondary/10" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              const dayEvents = events.filter((e) => e.start_time.startsWith(dateStr));

              return (
                <div
                  key={dayNum}
                  className={`min-h-[105px] p-2 flex flex-col justify-between hover:bg-secondary/20 transition-colors ${
                    isToday ? "bg-primary/5 font-semibold" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono h-5 w-5 rounded-full flex items-center justify-center ${
                        isToday ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium border border-border/50 text-foreground flex items-center gap-1"
                        style={{
                          backgroundColor: `${event.color}15`,
                          borderColor: `${event.color}40`,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-muted-foreground block text-right">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <Card className="border-border/80">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold">Upcoming Timeline Agenda</CardTitle>
            <CardDescription className="text-xs">
              Chronological schedule of events and commitments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {events.length === 0 ? (
              <div className="p-10 text-center text-xs text-muted-foreground">
                No scheduled events found.
              </div>
            ) : (
              events.map((event) => {
                const dateObj = new Date(event.start_time);
                const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-primary shrink-0"
                        style={{ backgroundColor: `${event.color}15` }}
                      >
                        {event.event_type === "meeting" ? (
                          <Video className="h-4 w-4" style={{ color: event.color }} />
                        ) : event.event_type === "focus" ? (
                          <Sparkles className="h-4 w-4" style={{ color: event.color }} />
                        ) : (
                          <CalendarIcon className="h-4 w-4" style={{ color: event.color }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {dateObj.toLocaleDateString()} at {timeStr}
                        </span>
                      </div>
                    </div>

                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {event.event_type}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Event Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Schedule Event</DialogTitle>
            <DialogDescription>
              Add meetings, focus deep work blocks, or milestones to your workspace calendar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Event Title</label>
              <Input
                placeholder="e.g. Deep Work: AI Core Engine Architecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Description</label>
              <textarea
                placeholder="Agenda, notes, or call links..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Date</label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="event">Event</option>
                  <option value="focus">Deep Focus Block</option>
                  <option value="meeting">Meeting</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Start Time</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={allDay || isSubmitting}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">End Time</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={allDay || isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Color</label>
              <div className="flex items-center gap-2 pt-1">
                {["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
                      color === c ? "scale-110 border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Event"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
