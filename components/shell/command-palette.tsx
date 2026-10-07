"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Home,
  Target,
  Calendar,
  CheckSquare,
  FolderGit2,
  FileText,
  Users2,
  PenTool,
  Bot,
  Settings,
  Search,
  Sparkles,
  ArrowRight,
  Video,
  Share2,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  section: string;
}

const NAV_ITEMS: NavItem[] = [
  { title: "Home / Command Center", href: "/home", icon: Home, section: "Overview" },
  { title: "Goals (Vision, Year, Quarter)", href: "/goals", icon: Target, section: "Execution" },
  { title: "Planning (Today, Week, Month)", href: "/plan", icon: Calendar, section: "Execution" },
  { title: "Tasks & To-Dos", href: "/tasks", icon: CheckSquare, section: "Execution" },
  { title: "Projects & Roadmaps", href: "/projects", icon: FolderGit2, section: "Execution" },
  { title: "Notes & Tiptap Editor", href: "/notes", icon: FileText, section: "Knowledge" },
  { title: "Knowledge Base, Files & Bookmarks", href: "/knowledge", icon: FileText, section: "Knowledge" },
  { title: "CRM & Contacts", href: "/crm", icon: Users2, section: "Business" },
  { title: "Meetings & Action Items", href: "/meetings", icon: Video, section: "Business" },
  { title: "Content Calendar & Pipeline", href: "/content", icon: Share2, section: "Business" },
  { title: "Whiteboard & Mind Maps", href: "/whiteboards", icon: PenTool, section: "Creative" },
  { title: "AI Assistant & Memory", href: "/ai", icon: Bot, section: "AI" },
  { title: "Settings & Workspaces", href: "/settings", icon: Settings, section: "System" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return NAV_ITEMS;
    const q = search.toLowerCase();
    return NAV_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl overflow-hidden gap-0 border-border/80 shadow-2xl">
        <div className="flex items-center px-4 border-b border-border/60 bg-background/50">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            className="flex h-12 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            placeholder="Type a command or search modules... (e.g. goals, tasks, crm)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-secondary px-1.5 text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No matching modules found.
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-secondary/70 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-secondary text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {item.section}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-border/60 bg-secondary/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>وثّقلي Command Palette</span>
          </div>
          <span>Use ↑ ↓ to navigate, ↵ to select</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
