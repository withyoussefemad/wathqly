"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckSquare, FileText, Lightbulb, Bookmark, Users, Zap, Check } from "lucide-react";
import { toast } from "sonner";
import { createNoteAction, createBookmarkAction } from "@/actions/knowledge";
import { createTaskAction } from "@/actions/core-os";
import { createDealAction } from "@/actions/crm";

type CaptureType = "task" | "note" | "idea" | "bookmark" | "crm";

export function QuickCaptureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [content, setContent] = React.useState("");
  const [type, setType] = React.useState<CaptureType>("task");
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;

    if (type === "note" || type === "idea") {
      const lines = content.trim().split("\n");
      const title = lines[0].slice(0, 100);
      await createNoteAction({
        title,
        plain_text: content,
        content_html: `<p>${content.replace(/\n/g, "<br/>")}</p>`,
        tags: [type],
      });
    } else if (type === "bookmark") {
      let url = content.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }
      await createBookmarkAction({
        url,
        title: `Captured Bookmark: ${url}`,
        description: content,
      });
    } else if (type === "task") {
      const fd = new FormData();
      fd.append("title", content.trim());
      fd.append("priority", "medium");
      fd.append("isMyDay", "true");
      await createTaskAction(fd);
    } else if (type === "crm") {
      await createDealAction({
        title: content.trim(),
        stage: "lead",
        value: 10000,
        priority: "medium",
      });
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setContent("");
      onOpenChange(false);
      toast.success(`Captured to ${type.toUpperCase()}!`);
    }, 400);
  };

  const types: { id: CaptureType; label: string; icon: React.ElementType }[] = [
    { id: "task", label: "Task", icon: CheckSquare },
    { id: "note", label: "Note", icon: FileText },
    { id: "idea", label: "Idea", icon: Lightbulb },
    { id: "bookmark", label: "Bookmark", icon: Bookmark },
    { id: "crm", label: "Lead / CRM", icon: Users },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5 border-border/80 shadow-2xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-semibold">Quick Capture</DialogTitle>
          </div>
        </DialogHeader>

        {/* Capture Type Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-secondary/60 rounded-md border border-border/50">
          {types.map((t) => {
            const Icon = t.icon;
            const isSelected = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-sm transition-all cursor-pointer ${
                  isSelected
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : ""}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Capture Input */}
        <div className="pt-2">
          <textarea
            className="w-full min-h-[110px] p-3 text-sm rounded-md border border-border/80 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            placeholder={
              type === "task"
                ? "What needs to get done? e.g. Finish Phase 0 RLS policies by 5pm"
                : type === "note"
                ? "Quick thought or note to document..."
                : type === "idea"
                ? "Spark of inspiration or product idea..."
                : type === "bookmark"
                ? "Paste URL or reference link..."
                : "Lead name or follow-up note..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <div className="flex justify-between items-center mt-1 text-[11px] text-muted-foreground">
            <span>Press ⌘+Enter to save immediately</span>
            <span className="capitalize">Destination: {type}</span>
          </div>
        </div>

        <DialogFooter className="pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!content.trim() || isSaved}
            className="gap-1.5"
          >
            {isSaved ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              "Save Item"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
