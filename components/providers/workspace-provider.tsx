"use client";

import * as React from "react";
import type { Workspace, Profile } from "@/lib/supabase/types";
import { setActiveWorkspaceAction } from "@/actions/workspace";
import { useRouter } from "next/navigation";

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  profile: Profile | null;
  setCurrentWorkspace: (workspace: Workspace) => Promise<void>;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: React.ReactNode;
  initialWorkspace: Workspace | null;
  initialWorkspaces: Workspace[];
  initialProfile: Profile | null;
}

export function WorkspaceProvider({
  children,
  initialWorkspace,
  initialWorkspaces,
  initialProfile,
}: WorkspaceProviderProps) {
  const router = useRouter();
  const [currentWorkspace, setCurrentWorkspaceState] = React.useState<Workspace | null>(
    initialWorkspace || initialWorkspaces[0] || {
      id: "demo-ws-1",
      name: "Personal Workspace",
      slug: "personal",
      avatar_url: null,
      created_by: "demo-user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const [workspaces] = React.useState<Workspace[]>(
    initialWorkspaces.length > 0
      ? initialWorkspaces
      : [
          {
            id: "demo-ws-1",
            name: "Personal Workspace",
            slug: "personal",
            avatar_url: null,
            created_by: "demo-user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "demo-ws-2",
            name: "Founder Lab",
            slug: "founder-lab",
            avatar_url: null,
            created_by: "demo-user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
  );

  const [profile] = React.useState<Profile | null>(
    initialProfile || {
      id: "demo-user",
      email: "youssef@wathqly.app",
      full_name: "Youssef Emad",
      avatar_url: null,
      locale: "en",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const setCurrentWorkspace = async (workspace: Workspace) => {
    setCurrentWorkspaceState(workspace);
    try {
      await setActiveWorkspaceAction(workspace.id);
    } catch {
      // Ignored in offline/demo mode
    }
    router.refresh();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        profile,
        setCurrentWorkspace,
        isCreateOpen,
        setIsCreateOpen,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
