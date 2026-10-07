"use client";

import { useState } from "react";
import { aiAssistantAction, createDailyPlanAction, createWeeklyPlanAction, aiReviewAction, getAiMemoriesAction } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, CalendarDays, CheckCircle2, Database, MessageSquare, Sparkles } from "lucide-react";

export function AiAssistant() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<Array<Record<string, unknown>>>();

  const submit = async () => {
    setLoading(true);
    const response = await aiAssistantAction({ prompt, tools: ["create_plan", "create_review", "get_memory"] });
    setAnswer(response.success ? response.answer ?? "" : response.message ?? "");
    setLoading(false);
  };

  const loadMemories = async () => setMemories(await getAiMemoriesAction());

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Daily plan</CardTitle></CardHeader><CardContent><Button className="w-full" onClick={async () => { await createDailyPlanAction({ objective: "Complete the highest-impact workspace outcomes" }); }}>Generate plan</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Weekly plan</CardTitle></CardHeader><CardContent><Button className="w-full" onClick={async () => { await createWeeklyPlanAction({ objective: "Deliver meaningful progress and review blockers" }); }}>Generate week</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> AI review</CardTitle></CardHeader><CardContent><Button className="w-full" onClick={async () => { await aiReviewAction({ entityType: "project", entityId: "00000000-0000-1000-8000-000000000001" }); }}>Review workspace</Button></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> AI assistant</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2"><Input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask the assistant about your workspace…" /><Button onClick={submit} disabled={loading || !prompt.trim()}>{loading ? "Thinking…" : "Ask"}</Button></div>
          {answer && <div className="rounded-lg border border-border bg-background p-4 text-sm leading-relaxed whitespace-pre-wrap">{answer}</div>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Memory</CardTitle></CardHeader><CardContent><Button variant="outline" onClick={loadMemories}>Load workspace memory</Button>{memories?.length ? <div className="mt-3 space-y-2">{memories.map((entry, index) => <div key={index as number} className="rounded-md bg-secondary/50 p-3 text-xs"><p className="font-medium">{String(entry.key)}</p><p className="text-muted-foreground mt-1">{String(entry.value)}</p></div>)}</div> : null}</CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Retrieval</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Gemini receives only a bounded, workspace-scoped retrieval context. No unrestricted database payload is sent to the model.</p></CardContent></Card>
      </div>
    </div>
  );
}
