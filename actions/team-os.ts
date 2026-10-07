"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/actions/workspace";
import { canManageWorkspace, canWriteData } from "@/lib/permissions/workspace";
import {
  addWorkspaceMemberSchema,
  approvalDecisionSchema,
  approvalRequestSchema,
  createTeamSchema,
  projectCommentSchema,
  projectMemberSchema,
  teamMemberSchema,
} from "@/schemas/team-os";
import type { ApprovalRequest, Project, ProjectComment, ProjectMember, Team, TeamMember, WorkspaceMember, WorkspaceRole } from "@/lib/supabase/types";

async function getTeamContext() {
  const [workspace, supabase] = await Promise.all([getActiveWorkspace(), createClient()]);
  const { data: { user } } = await supabase.auth.getUser();
  if (!workspace || !user) return { error: "Sign in and select a workspace.", workspace: null, supabase, user: null, role: null };
  const { data: membership, error } = await supabase.from("workspace_members").select("role").eq("workspace_id", workspace.id).eq("user_id", user.id).maybeSingle();
  if (error || !membership) return { error: "Workspace membership could not be verified.", workspace: null, supabase, user: null, role: null };
  return { error: null, workspace, supabase, user, role: membership.role as WorkspaceRole };
}

async function recordAudit(supabase: Awaited<ReturnType<typeof createClient>>, workspaceId: string, userId: string, action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown> = {}) {
  await supabase.from("audit_logs").insert({ workspace_id: workspaceId, user_id: userId, action, entity_type: entityType, entity_id: entityId, metadata });
}

export async function getTeamDashboardAction() {
  const context = await getTeamContext();
  if (context.error || !context.workspace || !context.user || !context.role) {
    return { success: false as const, message: context.error || "Workspace unavailable.", role: null, members: [], teams: [], teamMembers: [], projects: [], projectMembers: [], comments: [], approvals: [] };
  }

  const workspaceId = context.workspace.id;
  const [memberResult, teamResult, teamMemberResult, projectResult, projectMemberResult, commentResult, approvalResult] = await Promise.all([
    context.supabase.from("workspace_members").select("*").eq("workspace_id", workspaceId).order("joined_at"),
    context.supabase.from("teams").select("*").eq("workspace_id", workspaceId).order("name"),
    context.supabase.from("team_members").select("*").eq("workspace_id", workspaceId),
    context.supabase.from("projects").select("id,name,status").eq("workspace_id", workspaceId).order("name"),
    context.supabase.from("project_members").select("*").eq("workspace_id", workspaceId),
    context.supabase.from("project_comments").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(100),
    context.supabase.from("approval_requests").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(100),
  ]);
  const error = memberResult.error || teamResult.error || teamMemberResult.error || projectResult.error || projectMemberResult.error || commentResult.error || approvalResult.error;
  if (error) return { success: false as const, message: error.message, role: context.role, members: [], teams: [], teamMembers: [], projects: [], projectMembers: [], comments: [], approvals: [] };

  const members = (memberResult.data || []) as WorkspaceMember[];
  const userIds = [...new Set([
    ...members.map((member) => member.user_id),
    ...(commentResult.data || []).map((comment) => comment.user_id),
    ...(approvalResult.data || []).map((approval) => approval.requested_by),
  ])];
  const profileResult = userIds.length
    ? await context.supabase.from("profiles").select("id,email,full_name,avatar_url").in("id", userIds)
    : { data: [], error: null };
  if (profileResult.error) return { success: false as const, message: profileResult.error.message, role: context.role, members: [], teams: [], teamMembers: [], projects: [], projectMembers: [], comments: [], approvals: [] };
  const profileMap = new Map((profileResult.data || []).map((profile) => [profile.id, profile]));

  return {
    success: true as const,
    role: context.role,
    members: members.map((member) => ({ ...member, profile: profileMap.get(member.user_id) || null })),
    teams: (teamResult.data || []) as Team[],
    teamMembers: (teamMemberResult.data || []) as TeamMember[],
    projects: (projectResult.data || []) as Pick<Project, "id" | "name" | "status">[],
    projectMembers: (projectMemberResult.data || []) as ProjectMember[],
    comments: ((commentResult.data || []) as ProjectComment[]).map((comment) => ({ ...comment, profile: profileMap.get(comment.user_id) || null })),
    approvals: ((approvalResult.data || []) as ApprovalRequest[]).map((approval) => ({ ...approval, requester: profileMap.get(approval.requested_by) || null })),
  };
}

export async function addWorkspaceMemberAction(input: unknown) {
  const context = await getTeamContext();
  if (context.error || !context.workspace || !context.user || !context.role) return { success: false, message: context.error || "Workspace unavailable." };
  if (!canManageWorkspace(context.role)) return { success: false, message: "Only workspace admins can add members." };
  const parsed = addWorkspaceMemberSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Invalid member details." };
  const { data, error } = await context.supabase.rpc("add_workspace_member_by_email", { ws_id: context.workspace.id, member_email: parsed.data.email, member_role: parsed.data.role });
  if (error || !data) return { success: false, message: error?.message || "Could not add that member." };
  await recordAudit(context.supabase, context.workspace.id, context.user.id, "member.added", "workspace_member", data, { role: parsed.data.role });
  revalidatePath("/team");
  return { success: true };
}

export async function updateWorkspaceMemberRoleAction(userId: string, role: WorkspaceRole) {
  const context = await getTeamContext();
  if (context.error || !context.workspace || !context.user || !context.role) return { success: false, message: context.error || "Workspace unavailable." };
  if (!canManageWorkspace(context.role)) return { success: false, message: "Only workspace admins can change roles." };
  if (userId === context.user.id || role === "owner") return { success: false, message: "Owner assignment or self-role changes are not allowed here." };
  if (role === "admin" && context.role !== "owner") return { success: false, message: "Only the owner can grant admin access." };
  const { data: target, error: targetError } = await context.supabase.from("workspace_members").select("role").eq("workspace_id", context.workspace.id).eq("user_id", userId).maybeSingle();
  if (targetError || !target) return { success: false, message: targetError?.message || "Member not found." };
  if (target.role === "owner") return { success: false, message: "The workspace owner cannot be changed here." };
  if (target.role === "admin" && context.role !== "owner") return { success: false, message: "Only the owner can change an admin role." };
  const { error } = await context.supabase.from("workspace_members").update({ role }).eq("workspace_id", context.workspace.id).eq("user_id", userId);
  if (error) return { success: false, message: error.message };
  await recordAudit(context.supabase, context.workspace.id, context.user.id, "member.role_changed", "workspace_member", userId, { from: target.role, to: role });
  revalidatePath("/team");
  return { success: true };
}

export async function removeWorkspaceMemberAction(userId: string) {
  const context = await getTeamContext();
  if (context.error || !context.workspace || !context.user || !context.role) return { success: false, message: context.error || "Workspace unavailable." };
  if (userId === context.user.id && context.role === "owner") return { success: false, message: "Transfer ownership before leaving this workspace." };
  if (userId !== context.user.id && !canManageWorkspace(context.role)) return { success: false, message: "Only admins can remove other members." };
  const { data: target, error: targetError } = await context.supabase.from("workspace_members").select("role").eq("workspace_id", context.workspace.id).eq("user_id", userId).maybeSingle();
  if (targetError || !target) return { success: false, message: targetError?.message || "Member not found." };
  if (target.role === "owner") return { success: false, message: "The workspace owner cannot be removed." };
  if (target.role === "admin" && context.role !== "owner") return { success: false, message: "Only the owner can remove an admin." };
  const { error } = await context.supabase.from("workspace_members").delete().eq("workspace_id", context.workspace.id).eq("user_id", userId);
  if (error) return { success: false, message: error.message };
  await recordAudit(context.supabase, context.workspace.id, context.user.id, "member.removed", "workspace_member", userId);
  revalidatePath("/team");
  return { success: true };
}

export async function createTeamAction(input: unknown) {
  const context = await getTeamContext();
  if (context.error || !context.workspace || !context.user || !context.role) return { success: false, message: context.error || "Workspace unavailable." };
  if (!canManageWorkspace(context.role)) return { success: false, message: "Only admins can create teams." };
  const parsed = createTeamSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Invalid team details." };
  const { error } = await context.supabase.from("teams").insert({ ...parsed.data, workspace_id: context.workspace.id, created_by: context.user.id });
  if (error) return { success: false, message: error.message };
  revalidatePath("/team");
  return { success: true };
}

export async function assignTeamMemberAction(input: unknown, assigned: boolean) {
  const parsed = teamMemberSchema.safeParse(input);
  const context = await getTeamContext();
  if (!parsed.success) return { success: false, message: "Invalid team assignment." };
  if (context.error || !context.workspace || !context.role) return { success: false, message: context.error || "Workspace unavailable." };
  if (!canManageWorkspace(context.role)) return { success: false, message: "Only admins can manage team assignments." };
  const values = { team_id: parsed.data.teamId, user_id: parsed.data.userId, workspace_id: context.workspace.id };
  const query = context.supabase.from("team_members");
  const { error } = assigned
    ? await query.insert(values)
    : await query.delete().eq("team_id", values.team_id).eq("workspace_id", values.workspace_id).eq("user_id", values.user_id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/team");
  return { success: true };
}

export async function assignProjectMemberAction(input: unknown, assigned: boolean) {
  const parsed = projectMemberSchema.safeParse(input);
  const context = await getTeamContext();
  if (!parsed.success) return { success: false, message: "Invalid project assignment." };
  if (context.error || !context.workspace || !context.user || !context.role) return { success: false, message: context.error || "Workspace unavailable." };
  if (!canManageWorkspace(context.role)) return { success: false, message: "Only admins can manage shared project access." };
  const values = { project_id: parsed.data.projectId, user_id: parsed.data.userId, workspace_id: context.workspace.id, added_by: context.user.id };
  const query = context.supabase.from("project_members");
  const { error } = assigned
    ? await query.insert(values)
    : await query.delete().eq("project_id", values.project_id).eq("workspace_id", values.workspace_id).eq("user_id", values.user_id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/team");
  return { success: true };
}

export async function addProjectCommentAction(input: unknown) {
  const parsed = projectCommentSchema.safeParse(input);
  const context = await getTeamContext();
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Invalid comment." };
  if (context.error || !context.workspace || !context.user || !context.role) return { success: false, message: context.error || "Workspace unavailable." };
  if (!canWriteData(context.role)) return { success: false, message: "Viewers cannot add project comments." };
  const { error } = await context.supabase.from("project_comments").insert({ project_id: parsed.data.projectId, body: parsed.data.body, workspace_id: context.workspace.id, user_id: context.user.id });
  if (error) return { success: false, message: error.message };
  revalidatePath("/team");
  return { success: true };
}

export async function createApprovalRequestAction(input: unknown) {
  const parsed = approvalRequestSchema.safeParse(input);
  const context = await getTeamContext();
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message || "Invalid approval request." };
  if (context.error || !context.workspace || !context.user || !context.role) return { success: false, message: context.error || "Workspace unavailable." };
  if (!canWriteData(context.role)) return { success: false, message: "Viewers cannot request approvals." };
  const { error } = await context.supabase.from("approval_requests").insert({ project_id: parsed.data.projectId, title: parsed.data.title, description: parsed.data.description, workspace_id: context.workspace.id, requested_by: context.user.id });
  if (error) return { success: false, message: error.message };
  revalidatePath("/team");
  return { success: true };
}

export async function decideApprovalRequestAction(input: unknown) {
  const parsed = approvalDecisionSchema.safeParse(input);
  const context = await getTeamContext();
  if (!parsed.success) return { success: false, message: "Invalid approval decision." };
  if (context.error || !context.workspace || !context.user || !context.role) return { success: false, message: context.error || "Workspace unavailable." };
  if (!canManageWorkspace(context.role)) return { success: false, message: "Only admins can decide approval requests." };
  const { data: request, error: requestError } = await context.supabase.from("approval_requests").select("requested_by,title").eq("id", parsed.data.id).eq("workspace_id", context.workspace.id).eq("status", "pending").maybeSingle();
  if (requestError || !request) return { success: false, message: requestError?.message || "Pending approval request not found." };
  const decidedAt = new Date().toISOString();
  const { data: updatedRequest, error } = await context.supabase.from("approval_requests").update({ status: parsed.data.decision, decided_by: context.user.id, decision_note: parsed.data.note, decided_at: decidedAt }).eq("id", parsed.data.id).eq("workspace_id", context.workspace.id).eq("status", "pending").select("id").maybeSingle();
  if (error) return { success: false, message: error.message };
  if (!updatedRequest) return { success: false, message: "This request has already been decided." };
  await context.supabase.from("notifications").insert({ workspace_id: context.workspace.id, user_id: request.requested_by, title: `Approval ${parsed.data.decision}`, message: `${request.title}${parsed.data.note ? `: ${parsed.data.note}` : ""}` });
  await recordAudit(context.supabase, context.workspace.id, context.user.id, `approval.${parsed.data.decision}`, "approval_request", parsed.data.id, { note: parsed.data.note });
  revalidatePath("/team");
  return { success: true };
}
