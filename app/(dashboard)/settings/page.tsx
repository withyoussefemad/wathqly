"use client";

import * as React from "react";
import Link from "next/link";
import { Settings, User, Building2, Shield, Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useWorkspace } from "@/components/providers/workspace-provider";

export default function SettingsPage() {
  const { currentWorkspace, profile, setIsCreateOpen } = useWorkspace();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-primary" />
          <span>Settings</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile, workspace details, members, and security.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">User Profile</CardTitle>
            </div>
            <CardDescription className="text-xs">Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                <Input defaultValue={profile?.full_name || "Youssef Emad"} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input defaultValue={profile?.email || "youssef@wathqly.app"} disabled />
              </div>
            </div>
            <Button size="sm" className="text-xs">Save Profile</Button>
          </CardContent>
        </Card>

        {/* Workspace Card */}
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Current Workspace</CardTitle>
              </div>
              <CardDescription className="text-xs">Settings for active workspace: <strong>{currentWorkspace?.name}</strong></CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)} className="text-xs">
              + New Workspace
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Workspace Name</label>
                <Input defaultValue={currentWorkspace?.name} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Workspace Slug</label>
                <Input defaultValue={currentWorkspace?.slug} disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspace Members & Roles */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Workspace Members</CardTitle>
            </div>
            <CardDescription className="text-xs">Review workspace members, roles, and project access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm"><Link href="/team">Manage team</Link></Button>
          </CardContent>
        </Card>

        {/* Appearance & Theme */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Appearance &amp; Theme</CardTitle>
            </div>
            <CardDescription className="text-xs">CertiLayer purple accent with Light, Dark, or System mode</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Toggle theme mode:</span>
            <ThemeToggle />
          </CardContent>
        </Card>

        {/* Security & RLS */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <CardTitle className="text-base font-semibold">Security &amp; Row Level Security</CardTitle>
            </div>
            <CardDescription className="text-xs">PostgreSQL RLS ensures tenant isolation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="p-3 rounded-md bg-success/10 text-success dark:text-success border border-success/20">
              ✓ Database Row Level Security (RLS) is active on all workspace tables.
            </div>
            <p>
              Every database entity is partitioned strictly by <code>workspace_id</code>. Requests are checked against session claims on the Supabase PostgreSQL layer.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
