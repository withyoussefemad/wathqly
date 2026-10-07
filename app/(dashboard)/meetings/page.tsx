"use client";

import * as React from "react";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Building2,
  FolderGit2,
  FileText,
  ListChecks,
  Check,
  Trash2,
  ChevronRight,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getMeetingsAction,
  createMeetingAction,
  deleteMeetingAction,
  extractMeetingInsightsAction,
  convertMeetingActionItemToTaskAction,
} from "@/actions/meetings";
import { getCompaniesAction } from "@/actions/crm";
import { getProjectsAction } from "@/actions/core-os";
import type { Meeting, Company, Project, MeetingActionItem } from "@/lib/supabase/types";

export default function MeetingsPage() {
  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [filter, setFilter] = React.useState<"all" | "scheduled" | "completed">("all");

  // Selected Meeting for Detailed Drawer/Modal
  const [selectedMeeting, setSelectedMeeting] = React.useState<Meeting | null>(null);
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [convertingTaskId, setConvertingTaskId] = React.useState<string | null>(null);

  // New Meeting Form
  const [openScheduleModal, setOpenScheduleModal] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [scheduledAt, setScheduledAt] = React.useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [durationMinutes, setDurationMinutes] = React.useState("30");
  const [location, setLocation] = React.useState("Google Meet");
  const [companyId, setCompanyId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [participantInput, setParticipantInput] = React.useState("");

  const loadData = React.useCallback(async () => {
    try {
      const [meetingsData, companiesData, projectsData] = await Promise.all([
        getMeetingsAction(),
        getCompaniesAction(),
        getProjectsAction(),
      ]);
      setMeetings(meetingsData);
      setCompanies(companiesData);
      setProjects(projectsData);

      // Refresh selected meeting if active
      if (selectedMeeting) {
        const refreshed = meetingsData.find((m) => m.id === selectedMeeting.id);
        if (refreshed) setSelectedMeeting(refreshed);
      }
    } catch {
      toast.error("Failed to load meetings");
    }
  }, [selectedMeeting]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    const participants = participantInput
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => ({
        name: p,
        email: p.includes("@") ? p : "",
      }));

    const res = await createMeetingAction({
      title: title.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes: Number(durationMinutes) || 30,
      location: location.trim() || "Virtual",
      companyId: companyId || null,
      projectId: projectId || null,
      notes: notes.trim() || undefined,
      participants,
    });

    if (res.success && res.data) {
      toast.success("Meeting scheduled successfully");
      setOpenScheduleModal(false);
      setTitle("");
      setNotes("");
      setParticipantInput("");
      loadData();
    } else {
      toast.error("Failed to schedule meeting");
    }
  };

  const handleExtractInsights = async (meetingId: string) => {
    setIsExtracting(true);
    try {
      const res = await extractMeetingInsightsAction(meetingId);
      if (res.success && res.data) {
        toast.success("AI Insights Extracted: Summary, decisions, and action items generated!");
        setSelectedMeeting(res.data);
        loadData();
      } else {
        toast.error("Could not extract insights");
      }
    } catch {
      toast.error("Error running AI workflow");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApproveActionItem = async (meetingId: string, item: MeetingActionItem) => {
    setConvertingTaskId(item.id);
    try {
      const res = await convertMeetingActionItemToTaskAction({
        meetingId,
        actionItemId: item.id,
        taskTitle: item.task_title,
        dueDate: item.due_date,
      });

      if (res.success) {
        toast.success(`Action Item approved and converted to Task: "${item.task_title}"`);
        loadData();
      } else {
        toast.error("Failed to convert action item");
      }
    } catch {
      toast.error("Error converting action item");
    } finally {
      setConvertingTaskId(null);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    if (selectedMeeting?.id === meetingId) {
      setSelectedMeeting(null);
    }
    await deleteMeetingAction(meetingId);
    toast.success("Meeting deleted");
    loadData();
  };

  const filteredMeetings = React.useMemo(() => {
    if (filter === "all") return meetings;
    return meetings.filter((m) => m.status === filter);
  }, [meetings, filter]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Video className="h-6 w-6 text-primary" />
            <span>Meetings &amp; Decisions</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agenda prep, attendee tracking, decisions record, and approval-driven AI task extraction.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 text-xs"
            onClick={() => setOpenScheduleModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Meeting</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs font-medium"
            onClick={() => setFilter("all")}
          >
            All Meetings ({meetings.length})
          </Button>
          <Button
            variant={filter === "scheduled" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs font-medium"
            onClick={() => setFilter("scheduled")}
          >
            Scheduled ({meetings.filter((m) => m.status === "scheduled").length})
          </Button>
          <Button
            variant={filter === "completed" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs font-medium"
            onClick={() => setFilter("completed")}
          >
            Completed ({meetings.filter((m) => m.status === "completed").length})
          </Button>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Human-approved AI Task Conversion</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Meeting List & Detailed Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Meetings List */}
        <div className={selectedMeeting ? "lg:col-span-5 space-y-3" : "lg:col-span-12 space-y-3"}>
          {filteredMeetings.length === 0 ? (
            <Card className="border-border/80 p-12 text-center text-sm text-muted-foreground">
              No meetings found. Click &quot;Schedule Meeting&quot; to create your first session.
            </Card>
          ) : (
            filteredMeetings.map((m) => {
              const isSelected = selectedMeeting?.id === m.id;
              const dateObj = new Date(m.scheduled_at);
              const isUpcoming = dateObj > new Date();

              return (
                <Card
                  key={m.id}
                  onClick={() => setSelectedMeeting(m)}
                  className={`p-4 cursor-pointer transition-all border ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/80 hover:border-primary/40 hover:bg-secondary/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                          {m.title}
                        </span>
                        <Badge
                          variant={m.status === "completed" ? "success" : isUpcoming ? "accent" : "secondary"}
                          className="text-[10px] capitalize"
                        >
                          {m.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="h-3 w-3" />
                          {dateObj.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {m.duration_minutes}m
                        </span>
                        {m.location && (
                          <span className="flex items-center gap-1 truncate max-w-[150px]">
                            <Video className="h-3 w-3 text-primary" />
                            {m.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "text-primary translate-x-1" : ""}`} />
                  </div>

                  {/* Connectors info */}
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {m.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-foreground" />
                          <span className="truncate max-w-[120px]">{m.company.name}</span>
                        </span>
                      )}
                      {m.project && (
                        <span className="flex items-center gap-1">
                          <FolderGit2 className="h-3 w-3 text-foreground" />
                          <span className="truncate max-w-[120px]">{m.project.name}</span>
                        </span>
                      )}
                    </div>
                    <span>
                      {m.action_items?.length || 0} action items • {m.decisions?.length || 0} decisions
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Right: Selected Meeting Deep Dive & AI Workflow Panel */}
        {selectedMeeting && (
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-border/80 sticky top-6 shadow-md">
              {/* Meeting Header */}
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold text-foreground">
                        {selectedMeeting.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs uppercase">
                        {selectedMeeting.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(selectedMeeting.scheduled_at).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {selectedMeeting.duration_minutes} minutes
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Location / Meeting link button */}
                {selectedMeeting.location && (
                  <div className="mt-3 flex items-center gap-2 text-xs bg-secondary/30 p-2 rounded-lg">
                    <Video className="h-4 w-4 text-primary" />
                    <span className="font-mono text-foreground select-all">
                      {selectedMeeting.location}
                    </span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-6 pt-4 text-xs">
                {/* 1. ATTENDEES */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>Participants ({selectedMeeting.participants?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedMeeting.participants || []).map((p) => (
                      <Badge key={p.id} variant="secondary" className="text-xs py-1 px-2.5">
                        <span className="font-medium text-foreground">{p.name}</span>
                        {p.role && <span className="text-muted-foreground ml-1">({p.role})</span>}
                      </Badge>
                    ))}
                    {(!selectedMeeting.participants || selectedMeeting.participants.length === 0) && (
                      <span className="text-muted-foreground italic">No participants logged</span>
                    )}
                  </div>
                </div>

                {/* 2. MEETING NOTES & AGENDA */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Discussion Notes &amp; Agenda</span>
                  </h4>
                  <div className="bg-secondary/20 p-3.5 rounded-lg border border-border/40 text-foreground whitespace-pre-wrap leading-relaxed text-xs">
                    {selectedMeeting.notes || "No notes entered yet."}
                  </div>
                </div>

                {/* 3. AI WORKFLOW TRIGGER (Section 15: Notes -> Summary -> Decisions -> Action Items) */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        AI Meeting Workflow
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleExtractInsights(selectedMeeting.id)}
                      disabled={isExtracting}
                      className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>{isExtracting ? "Analyzing..." : "Analyze & Extract Insights"}</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Section 15 compliant: Analyzes notes to synthesize executive summaries, agreed decisions, and pending action items for human review.
                  </p>

                  {/* Summary if present */}
                  {selectedMeeting.summary && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <p className="text-xs font-semibold text-foreground mb-1">Executive Summary:</p>
                      <p className="text-xs text-foreground/90 leading-relaxed bg-card/60 p-2.5 rounded-lg border border-border/50">
                        {selectedMeeting.summary}
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. DECISIONS MADE */}
                {selectedMeeting.decisions && selectedMeeting.decisions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span>Formal Decisions ({selectedMeeting.decisions.length})</span>
                    </h4>
                    <div className="space-y-2">
                      {selectedMeeting.decisions.map((dec) => (
                        <div
                          key={dec.id}
                          className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs flex items-start gap-2"
                        >
                          <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          <span className="text-foreground leading-snug">{dec.decision}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. ACTION ITEMS & HUMAN-IN-THE-LOOP APPROVAL */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <ListChecks className="h-3.5 w-3.5 text-primary" />
                      <span>Action Items ({selectedMeeting.action_items?.length || 0})</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      Click &quot;Approve&quot; to convert into Tasks
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {(!selectedMeeting.action_items || selectedMeeting.action_items.length === 0) ? (
                      <p className="text-xs text-muted-foreground italic">
                        No action items yet. Use the AI workflow above to extract items from notes.
                      </p>
                    ) : (
                      selectedMeeting.action_items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                            item.completed || item.created_task_id
                              ? "bg-secondary/20 border-border/60"
                              : "bg-card border-border/80 hover:border-primary/50"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-xs font-medium ${
                                item.completed || item.created_task_id
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {item.task_title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                              {item.assignee && <span>Assignee: {item.assignee}</span>}
                              {item.due_date && <span>• Due: {item.due_date}</span>}
                              {item.created_task_id && (
                                <Badge variant="success" className="text-[9px] py-0 px-1.5">
                                  Task Created
                                </Badge>
                              )}
                            </div>
                          </div>

                          {!item.created_task_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 shrink-0 hover:bg-success/10 hover:text-emerald-600 hover:border-emerald-500/40"
                              disabled={convertingTaskId === item.id}
                              onClick={() => handleApproveActionItem(selectedMeeting.id, item)}
                            >
                              <Check className="h-3 w-3" />
                              <span>{convertingTaskId === item.id ? "Creating..." : "Approve as Task"}</span>
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 6. FOLLOW-UPS */}
                {selectedMeeting.follow_ups && selectedMeeting.follow_ups.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-warning" />
                      <span>Client Follow-ups</span>
                    </h4>
                    <div className="space-y-1.5">
                      {selectedMeeting.follow_ups.map((fu) => (
                        <div
                          key={fu.id}
                          className="p-2.5 rounded-lg bg-amber-500/5 border border-warning/20 text-xs flex items-center justify-between"
                        >
                          <span className="text-foreground">{fu.description}</span>
                          {fu.due_date && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {fu.due_date}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* SCHEDULE MEETING MODAL */}
      <Dialog open={openScheduleModal} onOpenChange={setOpenScheduleModal}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleScheduleMeeting}>
            <DialogHeader>
              <DialogTitle className="text-lg">Schedule New Meeting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Meeting Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Enterprise Security Architecture Sync"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Date &amp; Time</label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Duration (Minutes)</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Location / Meeting URL</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Google Meet, Zoom link, or Room"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Link Company</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">None</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Link Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Participants (Comma-separated)</label>
                <Input
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  placeholder="Layla Al-Husseini, tariq@aramcodigital.com, Marcus"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Initial Agenda / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Paste agenda items or initial talking points..."
                  className="w-full min-h-[90px] rounded-md border border-input bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenScheduleModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Schedule Meeting
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
