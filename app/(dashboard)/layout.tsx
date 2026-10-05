import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { getUserWorkspaces, getActiveWorkspace } from "@/actions/workspace";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile: Profile | null = null;
  const workspaces = await getUserWorkspaces();
  const currentWorkspace = await getActiveWorkspace();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        profile = data as Profile;
      }
    }
  } catch {
    // Falls back gracefully
  }

  return (
    <WorkspaceProvider
      initialWorkspace={currentWorkspace}
      initialWorkspaces={workspaces}
      initialProfile={profile}
    >
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
