export type SidebarPreferences = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
};

export const DEFAULT_SIDEBAR_PREFERENCES: SidebarPreferences = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
};

export function normalizeSidebarPreferences(value: unknown): SidebarPreferences {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_SIDEBAR_PREFERENCES };
  }

  const candidate = value as Partial<SidebarPreferences>;
  return {
    sidebarCollapsed: candidate.sidebarCollapsed === true,
    mobileSidebarOpen: candidate.mobileSidebarOpen === true,
  };
}
