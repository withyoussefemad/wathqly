import type { WorkspaceRole } from "@/lib/supabase/types";

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export function hasMinimumRole(userRole: WorkspaceRole, minimumRequired: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRequired];
}

export function canManageWorkspace(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "admin");
}

export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === "owner";
}

export function canWriteData(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "member");
}

export function canReadData(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "viewer");
}
