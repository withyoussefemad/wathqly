"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  FolderGit2,
  FileText,
  Calendar,
  Sparkles,
  Plus,
  Users2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/components/providers/workspace-provider";

export default function HomePage() {
  const { currentWorkspace, profile } = useWorkspace();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Greeting & AI Briefing */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>{today}</span>
            <span>•</span>
            <span className="text-primary font-medium">{currentWorkspace?.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Youssef"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is your daily command center overview and priorities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
            <Link href="/plan">
              <Calendar className="h-3.5 w-3.5" />
              <span>Daily Plan</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs">
            <Link href="/tasks">
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* AI Intelligence Briefing Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                AI System Synthesis
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/30 text-primary">
                Connected OS
              </Badge>
            </div>
            <p className="text-sm text-foreground/90 leading-snug">
              Foundation phase initialized with secure workspace isolation and Row Level Security.
              3 core priorities scheduled for execution today.
            </p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs text-primary hover:text-primary gap-1 shrink-0">
          <Link href="/ai">
            Review recommendations
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today&apos;s Focus</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 / 5</div>
            <p className="text-[11px] text-muted-foreground mt-1">60% completed</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">On track for Q4</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Projects</CardTitle>
            <FolderGit2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-[11px] text-muted-foreground mt-1">Wathqly Architecture &amp; CertiLayer</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending Follow-ups</CardTitle>
            <Users2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">CRM lead review</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Priorities & Tasks (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Today&apos;s Priorities</CardTitle>
                <CardDescription className="text-xs">Highest leverage tasks for today</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/tasks">View all tasks</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { title: "Review Supabase schema & RLS policies", tag: "System", time: "10:00 AM", done: true },
                { title: "Configure app shell navigation & theme tokens", tag: "Frontend", time: "01:30 PM", done: true },
                { title: "Connect AI retrieval memory abstraction", tag: "AI Core", time: "04:00 PM", done: false },
                { title: "Write weekly reflection & milestone notes", tag: "Planning", time: "06:00 PM", done: false },
              ].map((task, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        task.done
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/50"
                      }`}
                    >
                      {task.done && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        task.done ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {task.tag}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.time}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Projects Widget */}
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Active Projects</CardTitle>
                <CardDescription className="text-xs">Current ongoing roadmap deliverables</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/projects">View projects</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Wathqly Phase 0 Foundation", progress: 100, status: "Ready", color: "bg-primary" },
                { name: "Phase 1 Core OS (Home, Goals, Plan)", progress: 25, status: "Next", color: "bg-blue-500" },
                { name: "Knowledge & Notes System", progress: 0, status: "Queued", color: "bg-zinc-400" },
              ].map((p, i) => (
                <div key={i} className="p-3 rounded-lg border border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div className={`${p.color} h-full rounded-full transition-all`} style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Progress</span>
                    <span>{p.progress}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Calendar & Recent Notes (Span 1) */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
              <CardDescription className="text-xs">Calendar timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { time: "11:00 AM", title: "Architecture Review", dur: "45m" },
                { time: "02:00 PM", title: "Supabase Schema Verification", dur: "30m" },
                { time: "05:00 PM", title: "Daily Execution Sync", dur: "15m" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="font-mono text-muted-foreground text-[11px] w-16 shrink-0 pt-0.5">
                    {item.time}
                  </div>
                  <div className="flex-1 pb-3 border-l-2 border-primary/40 pl-3">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.dur}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Recent Notes</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/notes">Notes</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { title: "Modular Monolith Architecture Guidelines", updated: "2h ago" },
                { title: "Connected OS Data Loop Principles", updated: "Yesterday" },
                { title: "CertiLayer Purple Theme Specifications", updated: "Oct 4" },
              ].map((note, i) => (
                <Link
                  key={i}
                  href="/notes"
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-secondary/60 transition-colors text-xs border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate font-medium">{note.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{note.updated}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
