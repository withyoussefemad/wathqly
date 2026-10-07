export type WorkspaceUserPreference = {
  workspace_id: string;
  user_id: string;
  preferences: {
    sidebarCollapsed: boolean;
    mobileSidebarOpen: boolean;
  };
  updated_at: string;
};
