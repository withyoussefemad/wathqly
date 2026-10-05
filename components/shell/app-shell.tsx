"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Target,
  Calendar,
  CheckSquare,
  FolderGit2,
  FileText,
  BookOpen,
  Users2,
  Video,
  PenTool,
  Bot,
  Settings,
  Search,
  Zap,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { CommandPalette } from "./command-palette";
import { QuickCaptureDialog } from "./quick-capture";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { signOutAction } from "@/actions/auth";
import { getInitials } from "@/lib/utils";

interface NavGroup {
  label: string;
  items: {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

const NAVIGATION: NavGroup[] = [
  {
    label: "Core",
    items: [
      { title: "Home", href: "/home", icon: Home },
    ],
  },
  {
    label: "Execution",
    items: [
      { title: "Plan", href: "/plan", icon: Calendar },
      { title: "Goals", href: "/goals", icon: Target },
      { title: "Projects", href: "/projects", icon: FolderGit2 },
      { title: "Tasks", href: "/tasks", icon: CheckSquare },
      { title: "Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { title: "Notes", href: "/notes", icon: FileText },
      { title: "Wiki & Files", href: "/knowledge", icon: BookOpen },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "CRM", href: "/crm", icon: Users2 },
      { title: "Meetings", href: "/meetings", icon: Video },
      { title: "Content", href: "/content", icon: FileText },
    ],
  },
  {
    label: "Creative & AI",
    items: [
      { title: "Whiteboard", href: "/whiteboards", icon: PenTool },
      { title: "AI Assistant", href: "/ai", icon: Bot, badge: "Core" },
    ],
  },
  {
    label: "Preferences",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useWorkspace();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = React.useState(false);

  // Global keyboard shortcuts (Cmd+K, Cmd+Shift+Space)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === " " || e.code === "Space")) {
        e.preventDefault();
        setQuickCaptureOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Format current page title
  const currentTitle = React.useMemo(() => {
    for (const group of NAVIGATION) {
      for (const item of group.items) {
        if (pathname.startsWith(item.href)) {
          return item.title;
        }
      }
    }
    return "Workspace";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar shrink-0 select-none">
        {/* Workspace Switcher Header */}
        <div className="p-3 border-b border-border/80 space-y-2">
          <div className="flex items-center justify-between px-1">
            <Link href="/home" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-xs">
                و
              </div>
              <span className="font-semibold text-sm tracking-tight">وثّقلي</span>
            </Link>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              v0.1
            </span>
          </div>
          <WorkspaceSwitcher />
        </div>

        {/* Quick action triggers */}
        <div className="px-3 py-2 space-y-1">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/40 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
            </span>
            <kbd className="h-4 px-1 rounded bg-background border border-border text-[9px] font-mono">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs bg-primary/5 hover:bg-primary/10 text-primary transition-colors border border-primary/20 cursor-pointer font-medium"
          >
            <span className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              <span>Quick Capture</span>
            </span>
            <kbd className="h-4 px-1 rounded bg-background border border-border text-[9px] font-mono text-muted-foreground">
              ⌘⇧␣
            </kbd>
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {NAVIGATION.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : ""}`} />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-border/80 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-2 w-full justify-between hover:bg-secondary">
                <div className="flex items-center gap-2 truncate">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="truncate text-left">
                    <p className="text-xs font-medium leading-none text-foreground truncate">
                      {profile?.full_name || "User"}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-none mt-1 truncate">
                      {profile?.email || "Personal"}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Signed in as <span className="font-semibold text-foreground">{profile?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer gap-2">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Profile & Preferences</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer gap-2">
                  <Settings className="h-3.5 w-3.5" />
                  <span>Workspace Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOutAction();
                }}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-xs flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Breadcrumb info */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">وثّقلي</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-semibold text-foreground">{currentTitle}</span>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickCaptureOpen(true)}
              className="hidden sm:inline-flex gap-1.5 h-8 text-xs border-primary/30 text-primary hover:bg-primary/5"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Quick Capture</span>
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCommandPaletteOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Command Palette (⌘K)"
            >
              <Search className="h-4 w-4" />
            </Button>

            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-sidebar flex flex-col h-full z-10 border-r border-border p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  و
                </div>
                <span className="font-semibold text-sm">وثّقلي</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <WorkspaceSwitcher />

            <div className="flex-1 overflow-y-auto space-y-3 pt-2">
              {NAVIGATION.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOutAction();
                }}
                className="text-xs text-destructive hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <QuickCaptureDialog open={quickCaptureOpen} onOpenChange={setQuickCaptureOpen} />
      <CreateWorkspaceDialog />
    </div>
  );
}
