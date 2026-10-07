"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, FolderKanban, MessageSquare, Plus, Shield, UsersRound, X } from "lucide-react";
import {
  addProjectCommentAction,
  addWorkspaceMemberAction,
  assignProjectMemberAction,
  assignTeamMemberAction,
  createApprovalRequestAction,
  createTeamAction,
  decideApprovalRequestAction,
  getTeamDashboardAction,
  removeWorkspaceMemberAction,
  updateWorkspaceMemberRoleAction,
} from "@/actions/team-os";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/components/providers/workspace-provider";
import type { WorkspaceRole } from "@/lib/supabase/types";

type TeamDashboard = Extract<Awaited<ReturnType<typeof getTeamDashboardAction>>, { success: true }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function TeamPage() {
  const { currentWorkspace } = useWorkspace();
  const [dashboard, setDashboard] = useState<TeamDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<Exclude<WorkspaceRole, "owner">>("member");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamAssignment, setTeamAssignment] = useState({ teamId: "", userId: "" });
  const [projectAssignment, setProjectAssignment] = useState({ projectId: "", userId: "" });
  const [commentProjectId, setCommentProjectId] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [approvalTitle, setApprovalTitle] = useState("");
  const [approvalDescription, setApprovalDescription] = useState("");
  const [approvalProjectId, setApprovalProjectId] = useState("");
  const [decisionNote, setDecisionNote] = useState("");

  const refresh = async () => {
    setLoading(true);
    const result = await getTeamDashboardAction();
    if (result.success) {
      setDashboard(result);
      setError("");
    } else {
      setDashboard(null);
      setError(result.message);
    }
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [currentWorkspace?.id]);

  const runMutation = async (operation: () => Promise<{ success: boolean; message?: string }>, message: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    const result = await operation();
    setBusy(false);
    if (!result.success) {
      setError(result.message || "The change could not be saved.");
      return false;
    }
    setNotice(message);
    await refresh();
    return true;
  };

  const handleAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await runMutation(() => addWorkspaceMemberAction({ email: memberEmail, role: memberRole }), "Member added.")) setMemberEmail("");
  };

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await runMutation(() => createTeamAction({ name: teamName, description: teamDescription }), "Team created.")) {
      setTeamName("");
      setTeamDescription("");
    }
  };

  const handleComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await runMutation(() => addProjectCommentAction({ projectId: commentProjectId, body: commentBody }), "Comment posted.")) setCommentBody("");
  };

  const handleApproval = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await runMutation(() => createApprovalRequestAction({ projectId: approvalProjectId || null, title: approvalTitle, description: approvalDescription }), "Approval requested.")) {
      setApprovalTitle("");
      setApprovalDescription("");
    }
  };

  const data = dashboard;
  const members = data?.members || [];
  const teams = data?.teams || [];
  const teamMembers = data?.teamMembers || [];
  const projects = data?.projects || [];
  const projectMembers = data?.projectMembers || [];
  const comments = data?.comments || [];
  const approvals = data?.approvals || [];
  const role = data?.role || null;
  const canManage = role === "owner" || role === "admin";
  const canWrite = canManage || role === "member";
  const pendingApprovals = approvals.filter((approval) => approval.status === "pending").length;
  const assignableRoles = role === "owner" ? ["admin", "member", "viewer"] as const : ["member", "viewer"] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary"><UsersRound className="h-4 w-4" /> WORKSPACE GOVERNANCE</div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Manage access, organize teams, share project updates, and make decisions with a clear record.</p>
        </div>
        {role && <Badge variant="outline" className="w-fit gap-1.5"><Shield className="h-3.5 w-3.5" />Your role: {role}</Badge>}
      </header>

      {(error || notice) && <div role={error ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-700/20 bg-emerald-700/5 text-emerald-800 dark:text-emerald-300"}`}>{error || notice}</div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xl font-semibold tabular-nums">{members.length}</p><p className="text-xs text-muted-foreground">Workspace members</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xl font-semibold tabular-nums">{teams.length}</p><p className="text-xs text-muted-foreground">Teams</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xl font-semibold tabular-nums">{projects.length}</p><p className="text-xs text-muted-foreground">Projects</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xl font-semibold tabular-nums">{pendingApprovals}</p><p className="text-xs text-muted-foreground">Pending approvals</p></CardContent></Card>
      </section>

      {loading && !dashboard ? <p className="py-14 text-center text-sm text-muted-foreground">Loading workspace team…</p> : !dashboard ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{error || "No team data available."}</CardContent></Card> : (
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="members">Members &amp; roles</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="projects">Shared projects</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="approvals">Approvals{pendingApprovals > 0 && <span className="ml-1 rounded-full bg-amber-600 px-1.5 text-[10px] text-white">{pendingApprovals}</span>}</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {canManage && <Card><CardHeader className="px-4 py-3"><CardTitle className="text-sm">Add a workspace member</CardTitle><CardDescription className="text-xs">The person must already have a Wathqly account.</CardDescription></CardHeader><CardContent><form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]" onSubmit={handleAddMember}><Input type="email" required value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="teammate@example.com" aria-label="Member email" /><select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={memberRole} onChange={(event) => setMemberRole(event.target.value as typeof memberRole)} aria-label="Initial role">{assignableRoles.map((option) => <option key={option} value={option}>{option}</option>)}</select><Button type="submit" disabled={busy}><Plus className="h-4 w-4" />Add member</Button></form></CardContent></Card>}
            <Card><CardHeader className="border-b border-border/70 px-4 py-3"><CardTitle className="text-sm">Workspace access</CardTitle><CardDescription className="text-xs">Owners retain control. Only the owner can grant admin access.</CardDescription></CardHeader><CardContent className="divide-y divide-border p-0">{members.map((member) => <div key={member.user_id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.profile?.full_name || member.profile?.email || "Workspace member"}</p><p className="truncate text-xs text-muted-foreground">{member.profile?.email}</p></div><div className="flex items-center gap-2"><Badge variant={member.role === "owner" ? "default" : "secondary"}>{member.role}</Badge>{canManage && member.role !== "owner" && <><select className="h-8 rounded-md border border-input bg-background px-2 text-xs" value={member.role} disabled={busy || (member.role === "admin" && role !== "owner")} onChange={(event) => void runMutation(() => updateWorkspaceMemberRoleAction(member.user_id, event.target.value as WorkspaceRole), "Member role updated.")} aria-label={`Role for ${member.profile?.email || "member"}`}>{assignableRoles.map((option) => <option key={option} value={option}>{option}</option>)}</select><Button variant="ghost" size="icon-sm" disabled={busy || (member.role === "admin" && role !== "owner")} title="Remove member" aria-label={`Remove ${member.profile?.email || "member"}`} onClick={() => { if (window.confirm(`Remove ${member.profile?.email || "this member"} from the workspace?`)) void runMutation(() => removeWorkspaceMemberAction(member.user_id), "Member removed."); }}><X className="h-4 w-4 text-destructive" /></Button></>}</div></div>)}{members.length === 0 && <p className="p-6 text-sm text-muted-foreground">No members found.</p>}</CardContent></Card>
          </TabsContent>

          <TabsContent value="teams" className="grid gap-4 xl:grid-cols-[minmax(260px,.8fr)_minmax(0,1.2fr)]">
            {canManage && <Card className="h-fit"><CardHeader className="px-4 py-3"><CardTitle className="text-sm">Create a team</CardTitle><CardDescription className="text-xs">Teams organize members inside this workspace.</CardDescription></CardHeader><CardContent><form className="space-y-3" onSubmit={handleCreateTeam}><Input required minLength={2} maxLength={80} value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Product" aria-label="Team name" /><Input maxLength={300} value={teamDescription} onChange={(event) => setTeamDescription(event.target.value)} placeholder="Team focus" aria-label="Team description" /><Button type="submit" disabled={busy}><Plus className="h-4 w-4" />Create team</Button></form></CardContent></Card>}
            <div className="space-y-3">{teams.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No teams yet.</CardContent></Card> : teams.map((team) => { const assigned = teamMembers.filter((assignment) => assignment.team_id === team.id); return <Card key={team.id}><CardHeader className="px-4 py-3"><CardTitle className="text-sm">{team.name}</CardTitle>{team.description && <CardDescription>{team.description}</CardDescription>}</CardHeader><CardContent className="space-y-3 px-4 pb-4">{canManage && <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={teamAssignment.teamId === team.id ? teamAssignment.userId : ""} onChange={(event) => setTeamAssignment({ teamId: team.id, userId: event.target.value })} aria-label={`Choose a member for ${team.name}`}><option value="">Add member…</option>{members.filter((member) => !assigned.some((assignment) => assignment.user_id === member.user_id)).map((member) => <option key={member.user_id} value={member.user_id}>{member.profile?.full_name || member.profile?.email || "Workspace member"}</option>)}</select><Button disabled={busy || teamAssignment.teamId !== team.id || !teamAssignment.userId} onClick={() => void runMutation(() => assignTeamMemberAction({ teamId: team.id, userId: teamAssignment.userId }, true), "Team member added.")}><Plus className="h-4 w-4" />Assign</Button></div>}<div className="flex flex-wrap gap-2">{assigned.map((assignment) => { const member = members.find((entry) => entry.user_id === assignment.user_id); return <Badge key={assignment.user_id} variant="outline" className="gap-1.5">{member?.profile?.full_name || member?.profile?.email || "Workspace member"}{canManage && <button aria-label={`Remove member from ${team.name}`} onClick={() => void runMutation(() => assignTeamMemberAction({ teamId: team.id, userId: assignment.user_id }, false), "Team member removed.")}><X className="h-3 w-3" /></button>}</Badge>; })}</div></CardContent></Card>; })}</div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            {canManage && <Card><CardHeader className="px-4 py-3"><CardTitle className="text-sm">Share a project</CardTitle><CardDescription className="text-xs">Assign workspace members who are actively collaborating.</CardDescription></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={projectAssignment.projectId} onChange={(event) => setProjectAssignment({ ...projectAssignment, projectId: event.target.value })} aria-label="Project"><option value="">Choose project…</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={projectAssignment.userId} onChange={(event) => setProjectAssignment({ ...projectAssignment, userId: event.target.value })} aria-label="Member"><option value="">Choose member…</option>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.profile?.full_name || member.profile?.email || "Workspace member"}</option>)}</select><Button disabled={busy || !projectAssignment.projectId || !projectAssignment.userId} onClick={() => void runMutation(() => assignProjectMemberAction({ projectId: projectAssignment.projectId, userId: projectAssignment.userId }, true), "Project shared.")}><Plus className="h-4 w-4" />Share</Button></div></CardContent></Card>}
            <Card><CardHeader className="border-b border-border/70 px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><FolderKanban className="h-4 w-4 text-primary" />Project collaborators</CardTitle></CardHeader><CardContent className="divide-y divide-border p-0">{projects.map((project) => { const assigned = projectMembers.filter((assignment) => assignment.project_id === project.id); return <div key={project.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{project.name}</p><p className="text-xs capitalize text-muted-foreground">{project.status.replaceAll("_", " ")}</p></div><div className="flex flex-wrap gap-1.5">{assigned.map((assignment) => { const member = members.find((entry) => entry.user_id === assignment.user_id); return <Badge key={assignment.user_id} variant="outline" className="gap-1.5">{member?.profile?.full_name || member?.profile?.email || "Workspace member"}{canManage && <button aria-label={`Remove project access for ${member?.profile?.email || "member"}`} onClick={() => void runMutation(() => assignProjectMemberAction({ projectId: project.id, userId: assignment.user_id }, false), "Project access removed.")}><X className="h-3 w-3" /></button>}</Badge>; })}{assigned.length === 0 && <span className="text-xs text-muted-foreground">No assigned collaborators</span>}</div></div>; })}{projects.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Create a project before sharing it.</p>}</CardContent></Card>
          </TabsContent>

          <TabsContent value="collaboration" className="grid gap-4 lg:grid-cols-[minmax(260px,.7fr)_minmax(0,1.3fr)]">
            <Card className="h-fit"><CardHeader className="px-4 py-3"><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare className="h-4 w-4" />Project discussion</CardTitle><CardDescription className="text-xs">Updates are shared with workspace members.</CardDescription></CardHeader><CardContent><form className="space-y-3" onSubmit={handleComment}><select required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={commentProjectId} onChange={(event) => setCommentProjectId(event.target.value)} aria-label="Discussion project"><option value="">Choose project…</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><textarea required maxLength={3000} rows={4} value={commentBody} onChange={(event) => setCommentBody(event.target.value)} className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60" placeholder={canWrite ? "Share a project update…" : "Viewers have read-only access."} disabled={!canWrite} /><Button type="submit" disabled={busy || !canWrite}><MessageSquare className="h-4 w-4" />Post update</Button></form></CardContent></Card>
            <Card><CardHeader className="border-b border-border/70 px-4 py-3"><CardTitle className="text-sm">Recent project updates</CardTitle></CardHeader><CardContent className="divide-y divide-border p-0">{comments.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Project updates will appear here.</p> : comments.map((entry) => <article key={entry.id} className="px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{entry.profile?.full_name || entry.profile?.email || "Workspace member"}</p><time className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</time></div><p className="mt-1 text-xs text-muted-foreground">{projects.find((project) => project.id === entry.project_id)?.name || "Project"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{entry.body}</p></article>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="approvals" className="grid gap-4 lg:grid-cols-[minmax(260px,.7fr)_minmax(0,1.3fr)]">
            <Card className="h-fit"><CardHeader className="px-4 py-3"><CardTitle className="text-sm">Request approval</CardTitle><CardDescription className="text-xs">Record a decision request for an owner or admin.</CardDescription></CardHeader><CardContent><form className="space-y-3" onSubmit={handleApproval}><Input required minLength={2} maxLength={160} value={approvalTitle} onChange={(event) => setApprovalTitle(event.target.value)} placeholder="Approve launch scope" aria-label="Approval title" /><select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={approvalProjectId} onChange={(event) => setApprovalProjectId(event.target.value)} aria-label="Related project"><option value="">Workspace-wide</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><textarea rows={4} maxLength={3000} value={approvalDescription} onChange={(event) => setApprovalDescription(event.target.value)} className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Context and decision needed" aria-label="Approval context" /><Button type="submit" disabled={busy || !canWrite}><Plus className="h-4 w-4" />Submit request</Button></form></CardContent></Card>
            <Card><CardHeader className="border-b border-border/70 px-4 py-3"><CardTitle className="text-sm">Approval queue</CardTitle><CardDescription className="text-xs">Owners and admins decide pending requests.</CardDescription></CardHeader><CardContent className="divide-y divide-border p-0">{approvals.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No approval requests yet.</p> : approvals.map((approval) => <article key={approval.id} className="space-y-2 px-4 py-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-medium">{approval.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{approval.requester?.full_name || approval.requester?.email || "Member"} · {formatDate(approval.created_at)}{approval.project_id ? ` · ${projects.find((project) => project.id === approval.project_id)?.name || "Project"}` : " · Workspace-wide"}</p></div><Badge variant={approval.status === "pending" ? "warning" : approval.status === "approved" ? "success" : "destructive"}>{approval.status}</Badge></div>{approval.description && <p className="text-sm text-muted-foreground">{approval.description}</p>}{approval.decision_note && <p className="text-xs text-muted-foreground">Decision note: {approval.decision_note}</p>}{canManage && approval.status === "pending" && <div className="flex flex-col gap-2 sm:flex-row"><Input value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Decision note (optional)" aria-label={`Decision note for ${approval.title}`} /><Button size="sm" disabled={busy} onClick={() => void runMutation(() => decideApprovalRequestAction({ id: approval.id, decision: "approved", note: decisionNote }), "Approval recorded.")}><Check className="h-3.5 w-3.5" />Approve</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void runMutation(() => decideApprovalRequestAction({ id: approval.id, decision: "rejected", note: decisionNote }), "Approval recorded.")}><X className="h-3.5 w-3.5" />Reject</Button></div>}</article>)}</CardContent></Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
