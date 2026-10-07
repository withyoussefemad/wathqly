"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Bell, Check, History, Play, Plus, Power, Trash2, Workflow, Zap,
} from "lucide-react";
import {
  createAutomationAction,
  deleteAutomationAction,
  getAutomationDashboardAction,
  markNotificationReadAction,
  runAutomationNowAction,
  toggleAutomationAction,
} from "@/actions/automation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Automation, AutomationRun, Notification } from "@/lib/supabase/types";
import type { AutomationRuleInput } from "@/schemas/automation";

const triggerLabels: Record<Automation["trigger_type"], string> = {
  task_created: "Task created",
  task_completed: "Task completed",
  deal_stage_changed: "Deal stage changed",
  schedule: "Scheduled",
};

const initialForm = {
  name: "",
  description: "",
  triggerType: "task_created" as Automation["trigger_type"],
  conditionField: "" as "" | "priority" | "status" | "stage" | "title",
  operator: "equals" as "equals" | "not_equals" | "contains",
  conditionValue: "",
  actionType: "notify" as "notify" | "create_task",
  actionTitle: "",
  actionMessage: "",
  actionPriority: "medium" as "low" | "medium" | "high" | "urgent",
  scheduleTime: "",
  repeatInterval: "once" as "once" | "daily" | "weekly" | "monthly",
};

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Never";
}

function describeCondition(condition: Automation["conditions"][number]) {
  return `${condition.field.replaceAll("_", " ")} ${condition.operator.replaceAll("_", " ")} “${condition.value}”`;
}

function describeAction(action: Record<string, unknown>) {
  const title = typeof action.title === "string" ? action.title : "Untitled action";
  return action.type === "notify" ? `Notify: ${title}` : `Create task: ${title}`;
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    setLoading(true);
    const result = await getAutomationDashboardAction();
    if (result.success) {
      setAutomations(result.automations);
      setRuns(result.runs);
      setNotifications(result.notifications);
      setError("");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const createAutomation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const actions: AutomationRuleInput["actions"] = form.actionType === "notify"
      ? [{ type: "notify", title: form.actionTitle, message: form.actionMessage }]
      : [{ type: "create_task", title: form.actionTitle, priority: form.actionPriority }];
    const conditions: AutomationRuleInput["conditions"] = form.conditionField && form.conditionValue
      ? [{ field: form.conditionField, operator: form.operator, value: form.conditionValue }]
      : [];
    const input: Record<string, unknown> = {
      name: form.name,
      description: form.description,
      trigger_type: form.triggerType,
      conditions,
      actions,
      repeat_interval: form.triggerType === "schedule" ? form.repeatInterval : null,
      next_run_at: form.triggerType === "schedule" && form.scheduleTime ? new Date(form.scheduleTime).toISOString() : null,
    };
    const result = await createAutomationAction(input);
    setSaving(false);
    if (!result.success) {
      setError(result.message || "Could not create automation.");
      return;
    }
    setNotice("Automation created.");
    setDialogOpen(false);
    setForm(initialForm);
    await refresh();
  };

  const toggleAutomation = async (automation: Automation) => {
    setWorkingId(automation.id);
    const result = await toggleAutomationAction(automation.id, !automation.enabled);
    setWorkingId(null);
    if (!result.success) setError(result.message || "Could not update automation.");
    else await refresh();
  };

  const runAutomation = async (automation: Automation) => {
    setWorkingId(automation.id);
    const result = await runAutomationNowAction(automation.id);
    setWorkingId(null);
    if (!result.success) setError(result.message || "Automation run failed.");
    else setNotice("status" in result && result.status === "failed" ? result.message || "Run failed." : "Automation run recorded.");
    await refresh();
  };

  const removeAutomation = async (automation: Automation) => {
    if (!window.confirm(`Delete “${automation.name}” and keep its run history?`)) return;
    setWorkingId(automation.id);
    const result = await deleteAutomationAction(automation.id);
    setWorkingId(null);
    if (!result.success) setError(result.message || "Could not delete automation.");
    else await refresh();
  };

  const markRead = async (notification: Notification) => {
    const result = await markNotificationReadAction(notification.id);
    if (!result.success) setError(result.message || "Could not update notification.");
    else await refresh();
  };

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300"><Workflow className="h-4 w-4" /> WORKSPACE AUTOMATION</div>
          <h1 className="text-2xl font-semibold text-foreground">Automations</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Connect events and schedules to safe, useful follow-through.</p>
        </div>
        <Button onClick={() => { setError(""); setDialogOpen(true); }}><Plus className="h-4 w-4" /> New automation</Button>
      </header>

      {(error || notice) && <div role={error ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-700/20 bg-emerald-700/5 text-emerald-800 dark:text-emerald-300"}`}>{error || notice}</div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-3 p-4"><Workflow className="h-4 w-4 text-emerald-700" /><div><p className="text-xl font-semibold tabular-nums">{automations.length}</p><p className="text-xs text-muted-foreground">Total workflows</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Power className="h-4 w-4 text-emerald-700" /><div><p className="text-xl font-semibold tabular-nums">{automations.filter((automation) => automation.enabled).length}</p><p className="text-xs text-muted-foreground">Enabled</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><History className="h-4 w-4 text-blue-600" /><div><p className="text-xl font-semibold tabular-nums">{runs.length}</p><p className="text-xs text-muted-foreground">Recent runs</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Bell className="h-4 w-4 text-amber-600" /><div><p className="text-xl font-semibold tabular-nums">{unreadCount}</p><p className="text-xs text-muted-foreground">Unread notices</p></div></CardContent></Card>
      </section>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="workflows" className="gap-1.5"><Zap className="h-3.5 w-3.5" />Workflows</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" />History</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notifications{unreadCount > 0 && <span className="ml-1 rounded-full bg-emerald-700 px-1.5 text-[10px] text-white">{unreadCount}</span>}</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-3">
          {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading workflows…</p> : automations.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center px-6 py-14 text-center"><Workflow className="mb-3 h-8 w-8 text-muted-foreground" /><h2 className="text-base font-semibold">No workflows yet</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Start with an event trigger or a recurring schedule, then choose what should happen.</p><Button className="mt-5" variant="outline" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" />Create first automation</Button></CardContent></Card>
          ) : automations.map((automation) => (
            <Card key={automation.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{automation.name}</h2><Badge variant={automation.enabled ? "default" : "secondary"}>{automation.enabled ? "Enabled" : "Paused"}</Badge><Badge variant="outline">{triggerLabels[automation.trigger_type]}</Badge></div>
                  {automation.description && <p className="mt-1 text-sm text-muted-foreground">{automation.description}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">{automation.conditions.length} condition{automation.conditions.length === 1 ? "" : "s"} · {automation.actions.length} action{automation.actions.length === 1 ? "" : "s"} · Last run {formatDate(automation.last_run_at)}{automation.next_run_at ? ` · Next ${formatDate(automation.next_run_at)}` : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {automation.conditions.length > 0 && <span className="text-muted-foreground">If {automation.conditions.map(describeCondition).join(" and ")}</span>}
                    <span className="font-medium text-foreground">Then {automation.actions.map(describeAction).join("; ")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                  <Button variant="outline" size="sm" disabled={workingId === automation.id} onClick={() => void runAutomation(automation)} title="Run now"><Play className="h-3.5 w-3.5" />Run</Button>
                  <Button variant="ghost" size="icon-sm" disabled={workingId === automation.id} onClick={() => void toggleAutomation(automation)} title={automation.enabled ? "Pause workflow" : "Enable workflow"} aria-label={automation.enabled ? "Pause workflow" : "Enable workflow"}><Power className={`h-4 w-4 ${automation.enabled ? "text-emerald-700" : "text-muted-foreground"}`} /></Button>
                  <Button variant="ghost" size="icon-sm" disabled={workingId === automation.id} onClick={() => void removeAutomation(automation)} title="Delete workflow" aria-label="Delete workflow"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history">
          <Card><CardHeader className="border-b border-border/70 px-4 py-3"><CardTitle className="text-sm">Recent executions</CardTitle></CardHeader><CardContent className="p-0">
            {loading ? <p className="p-6 text-sm text-muted-foreground">Loading history…</p> : runs.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Automation runs will appear here.</p> : <div className="divide-y divide-border">{runs.map((run) => <div key={run.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium">{run.automation_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{triggerLabels[run.trigger_type as Automation["trigger_type"]] || run.trigger_type} · {formatDate(run.started_at)}</p>{run.error_message && <p className="mt-1 text-xs text-destructive">{run.error_message}</p>}</div><Badge variant={run.status === "success" ? "default" : run.status === "failed" ? "destructive" : "secondary"}>{run.status}</Badge></div>)}</div>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card><CardHeader className="border-b border-border/70 px-4 py-3"><CardTitle className="text-sm">Workspace notifications</CardTitle></CardHeader><CardContent className="p-0">
            {loading ? <p className="p-6 text-sm text-muted-foreground">Loading notifications…</p> : notifications.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Notifications generated by your workflows will appear here.</p> : <div className="divide-y divide-border">{notifications.map((notification) => <div key={notification.id} className="flex items-start gap-3 px-4 py-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read_at ? "bg-muted-foreground/30" : "bg-emerald-600"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{notification.title}</p><p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p><p className="mt-1 text-[11px] text-muted-foreground">{formatDate(notification.created_at)}</p></div>{!notification.read_at && <Button variant="ghost" size="icon-sm" title="Mark as read" aria-label="Mark notification as read" onClick={() => void markRead(notification)}><Check className="h-4 w-4" /></Button>}</div>)}</div>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>New automation</DialogTitle><DialogDescription>Choose when it runs, what must be true, and what it should do.</DialogDescription></DialogHeader>
          <form className="space-y-5" onSubmit={createAutomation}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium">Name<Input required minLength={2} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="High-priority task follow-up" /></label>
              <label className="space-y-1.5 text-xs font-medium">Trigger<select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.triggerType} onChange={(event) => setForm({ ...form, triggerType: event.target.value as Automation["trigger_type"] })}><option value="task_created">When a task is created</option><option value="task_completed">When a task is completed</option><option value="deal_stage_changed">When a deal stage changes</option><option value="schedule">On a schedule</option></select></label>
            </div>
            <label className="block space-y-1.5 text-xs font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span><Input maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What this workflow is for" /></label>

            {form.triggerType === "schedule" && <div className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-medium">First run<input required type="datetime-local" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.scheduleTime} onChange={(event) => setForm({ ...form, scheduleTime: event.target.value })} /></label><label className="space-y-1.5 text-xs font-medium">Repeat<select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.repeatInterval} onChange={(event) => setForm({ ...form, repeatInterval: event.target.value as typeof form.repeatInterval })}><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><p className="text-xs text-muted-foreground sm:col-span-2">Scheduled runs require the protected cron endpoint to be called by your deployment scheduler.</p></div>}

            {form.triggerType !== "schedule" && <div className="space-y-2 rounded-md border border-border p-3"><h3 className="text-xs font-semibold">Conditions <span className="font-normal text-muted-foreground">(all must match)</span></h3><div className="grid gap-2 sm:grid-cols-3"><select aria-label="Condition field" className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={form.conditionField} onChange={(event) => setForm({ ...form, conditionField: event.target.value as typeof form.conditionField })}><option value="">No condition</option><option value="priority">Priority</option><option value="status">Status</option><option value="stage">Stage</option><option value="title">Title</option></select><select aria-label="Condition operator" disabled={!form.conditionField} className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50" value={form.operator} onChange={(event) => setForm({ ...form, operator: event.target.value as typeof form.operator })}><option value="equals">is</option><option value="not_equals">is not</option><option value="contains">contains</option></select><Input disabled={!form.conditionField} value={form.conditionValue} onChange={(event) => setForm({ ...form, conditionValue: event.target.value })} placeholder="Value" aria-label="Condition value" /></div></div>}

            <div className="space-y-2 rounded-md border border-border p-3"><h3 className="text-xs font-semibold">Action</h3><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-xs font-medium">Do this<select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.actionType} onChange={(event) => setForm({ ...form, actionType: event.target.value as typeof form.actionType })}><option value="notify">Create notification</option><option value="create_task">Create task</option></select></label>{form.actionType === "create_task" && <label className="space-y-1.5 text-xs font-medium">Priority<select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.actionPriority} onChange={(event) => setForm({ ...form, actionPriority: event.target.value as typeof form.actionPriority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>}</div><label className="block space-y-1.5 text-xs font-medium">{form.actionType === "notify" ? "Notification title" : "Task title"}<Input required minLength={2} maxLength={form.actionType === "notify" ? 120 : 200} value={form.actionTitle} onChange={(event) => setForm({ ...form, actionTitle: event.target.value })} placeholder={form.actionType === "notify" ? "Follow-up needed" : "Review overdue work"} /></label>{form.actionType === "notify" && <label className="block space-y-1.5 text-xs font-medium">Message<Input required minLength={2} maxLength={500} value={form.actionMessage} onChange={(event) => setForm({ ...form, actionMessage: event.target.value })} placeholder="Add context for this notification" /></label>}</div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create automation"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
