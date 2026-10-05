"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Folder,
  Tag as TagIcon,
  Link2,
  Clock,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TiptapEditor } from "@/components/knowledge/tiptap-editor";
import {
  getNotesAction,
  getFoldersAction,
  getTagsAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
  togglePinNoteAction,
  getBacklinksAction,
  createFolderAction,
} from "@/actions/knowledge";
import { getGoalsAction, getProjectsAction, getTasksAction } from "@/actions/core-os";
import type { Note, Folder as FolderType, Tag, KnowledgeBacklink, Goal, Project, Task } from "@/lib/supabase/types";
import { toast } from "sonner";

export default function NotesPage() {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Active / Selected Note for Editing
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [activeBacklinks, setActiveBacklinks] = useState<KnowledgeBacklink[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // New Note Modal state
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Editor form state
  const [editTitle, setEditTitle] = useState("");
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editJson, setEditJson] = useState<Record<string, unknown>>({});
  const [editPlainText, setEditPlainText] = useState("");

  // Initial load
  const loadData = () => {
    startTransition(async () => {
      const [fetchedNotes, fetchedFolders, fetchedTags, fetchedGoals, fetchedProjects, fetchedTasks] =
        await Promise.all([
          getNotesAction(),
          getFoldersAction(),
          getTagsAction(),
          getGoalsAction(),
          getProjectsAction(),
          getTasksAction(),
        ]);

      setNotes(fetchedNotes);
      setFolders(fetchedFolders);
      setTags(fetchedTags);
      setGoals(fetchedGoals);
      setProjects(fetchedProjects);
      setTasks(fetchedTasks);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // When activeNote changes, load its backlinks and prep form
  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditFolderId(activeNote.folder_id);
      setEditProjectId(activeNote.project_id);
      setEditGoalId(activeNote.goal_id);
      setEditTaskId(activeNote.task_id);
      setEditTagsInput((activeNote.tags || []).map((t) => t.name).join(", "));
      setEditHtml(activeNote.content_html || "");
      setEditJson(activeNote.content || {});
      setEditPlainText(activeNote.plain_text || "");

      // fetch backlinks
      getBacklinksAction(activeNote.id).then((bl) => setActiveBacklinks(bl));
    }
  }, [activeNote]);

  const handleOpenNote = (note: Note) => {
    setActiveNote(note);
    setIsEditorOpen(true);
  };

  const handleCreateNewNote = () => {
    const newNoteObj: Note = {
      id: "temp-new",
      workspace_id: "demo-ws-1",
      folder_id: selectedFolderId,
      project_id: null,
      goal_id: null,
      task_id: null,
      title: "Untitled Note",
      content: {},
      content_html: "<p>Start writing your thoughts...</p>",
      plain_text: "Start writing your thoughts...",
      is_pinned: false,
      is_archived: false,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
    };
    setActiveNote(newNoteObj);
    setActiveBacklinks([]);
    setIsEditorOpen(true);
  };

  const handleSaveActiveNote = async () => {
    if (!editTitle.trim()) {
      toast.error("Please enter a note title");
      return;
    }

    const tagsArray = editTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    startTransition(async () => {
      if (activeNote?.id && activeNote.id !== "temp-new") {
        // Update
        const res = await updateNoteAction(activeNote.id, {
          title: editTitle,
          folder_id: editFolderId,
          project_id: editProjectId,
          goal_id: editGoalId,
          task_id: editTaskId,
          content: editJson,
          content_html: editHtml,
          plain_text: editPlainText,
        });
        if (res.success) {
          toast.success("Note updated");
          loadData();
          if (res.note) {
            setActiveNote(res.note);
            const bl = await getBacklinksAction(res.note.id);
            setActiveBacklinks(bl);
          }
        } else {
          toast.error("Failed to update note");
        }
      } else {
        // Create
        const res = await createNoteAction({
          title: editTitle,
          folder_id: editFolderId,
          project_id: editProjectId,
          goal_id: editGoalId,
          task_id: editTaskId,
          content: editJson,
          content_html: editHtml,
          plain_text: editPlainText,
          tags: tagsArray,
        });
        if (res.success && res.note) {
          toast.success("Note created");
          loadData();
          setActiveNote(res.note);
          const bl = await getBacklinksAction(res.note.id);
          setActiveBacklinks(bl);
        } else {
          toast.error("Failed to create note");
        }
      }
    });
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Are you sure you want to delete this note?")) return;

    startTransition(async () => {
      await deleteNoteAction(id);
      toast.success("Note deleted");
      if (activeNote?.id === id) {
        setIsEditorOpen(false);
        setActiveNote(null);
      }
      loadData();
    });
  };

  const handleTogglePin = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    startTransition(async () => {
      await togglePinNoteAction(id);
      loadData();
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    startTransition(async () => {
      const res = await createFolderAction({
        name: newFolderName,
        type: "notes",
        color: "#7C3AED",
      });
      if (res.success) {
        toast.success("Folder created");
        setNewFolderName("");
        setIsNewFolderOpen(false);
        loadData();
      }
    });
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (selectedFolderId && n.folder_id !== selectedFolderId) return false;
    if (selectedTag && !n.tags?.some((t) => t.name.toLowerCase() === selectedTag.toLowerCase())) {
      return false;
    }
    if (onlyPinned && !n.is_pinned) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchBody = n.plain_text.toLowerCase().includes(q);
      const matchTag = n.tags?.some((t) => t.name.toLowerCase().includes(q));
      if (!matchTitle && !matchBody && !matchTag) return false;
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.is_pinned);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-primary" />
            <span>Notes &amp; Knowledge</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture thoughts, architecture RFCs, meeting records, and connected knowledge with Tiptap &amp; backlinks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewFolderOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Folder className="h-3.5 w-3.5 text-primary" />
            <span>New Folder</span>
          </Button>
          <Button size="sm" onClick={handleCreateNewNote} className="gap-2 text-xs">
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title, content, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Folder Quick Filter */}
        <div>
          <select
            value={selectedFolderId || ""}
            onChange={(e) => setSelectedFolderId(e.target.value ? e.target.value : null)}
            className="w-full text-xs h-9 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Folders ({folders.length})</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pinned filter toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={onlyPinned ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyPinned(!onlyPinned)}
            className="h-9 text-xs gap-1.5 w-full"
          >
            <Pin className="h-3.5 w-3.5" />
            <span>{onlyPinned ? "Showing Pinned Only" : "Filter Pinned"}</span>
          </Button>
        </div>
      </div>

      {/* Tags Chips Bar */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-muted-foreground flex items-center gap-1 shrink-0 text-[11px]">
            <TagIcon className="h-3 w-3" /> Tags:
          </span>
          <Button
            variant={selectedTag === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedTag(null)}
            className="h-6 px-2 text-[11px] rounded-full"
          >
            All
          </Button>
          {tags.map((tag) => (
            <Button
              key={tag.id}
              variant={selectedTag === tag.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
              className="h-6 px-2.5 text-[11px] rounded-full gap-1"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
              <span>#{tag.name}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="space-y-6">
        {/* Pinned Notes Section */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5 text-primary rotate-45" />
              <span>Pinned Notes ({pinnedNotes.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onOpen={() => handleOpenNote(note)}
                  onTogglePin={(e) => handleTogglePin(note.id, e)}
                  onDelete={(e) => handleDeleteNote(note.id, e)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Notes Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>
              {pinnedNotes.length > 0 ? `Other Notes (${unpinnedNotes.length})` : `All Notes (${filteredNotes.length})`}
            </span>
          </h2>

          {filteredNotes.length === 0 ? (
            <div className="border border-dashed border-border/80 rounded-xl p-12 text-center space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <div className="text-sm font-medium text-foreground">No notes found</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery || selectedFolderId || selectedTag
                  ? "Try adjusting your filters or search query."
                  : "Start documenting your knowledge, architecture decisions, and notes."}
              </p>
              <Button size="sm" onClick={handleCreateNewNote} className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Note</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onOpen={() => handleOpenNote(note)}
                  onTogglePin={(e) => handleTogglePin(note.id, e)}
                  onDelete={(e) => handleDeleteNote(note.id, e)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FULL NOTE EDITOR & BACKLINKS DRAWER / DIALOG */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border/70 flex flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note title..."
                className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0 h-9"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveActiveNote}
                disabled={isPending}
                className="gap-1.5 text-xs border-primary/40 text-primary"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save</span>
              </Button>
              {activeNote && activeNote.id !== "temp-new" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  title="Delete Note"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Connected Metadata Bar (Folder, Goal, Project, Task, Tags) */}
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/50 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Folder</label>
              <select
                value={editFolderId || ""}
                onChange={(e) => setEditFolderId(e.target.value ? e.target.value : null)}
                className="w-full text-xs h-7 px-2 rounded border border-input bg-background text-foreground"
              >
                <option value="">No Folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Project</label>
              <select
                value={editProjectId || ""}
                onChange={(e) => setEditProjectId(e.target.value ? e.target.value : null)}
                className="w-full text-xs h-7 px-2 rounded border border-input bg-background text-foreground"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📦 {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Goal</label>
              <select
                value={editGoalId || ""}
                onChange={(e) => setEditGoalId(e.target.value ? e.target.value : null)}
                className="w-full text-xs h-7 px-2 rounded border border-input bg-background text-foreground"
              >
                <option value="">No Goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    🎯 {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Task</label>
              <select
                value={editTaskId || ""}
                onChange={(e) => setEditTaskId(e.target.value ? e.target.value : null)}
                className="w-full text-xs h-7 px-2 rounded border border-input bg-background text-foreground"
              >
                <option value="">No Task</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    ☑️ {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Tags</label>
              <Input
                value={editTagsInput}
                onChange={(e) => setEditTagsInput(e.target.value)}
                placeholder="tech, spec..."
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Scrollable Body: Tiptap Editor & Backlinks */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <TiptapEditor
              initialContent={editHtml}
              placeholder="Write with markdown, format text, or link notes using [[Note Title]]..."
              availableNotes={notes
                .filter((n) => n.id !== activeNote?.id)
                .map((n) => ({ id: n.id, title: n.title }))}
              onChange={({ html, json, plainText }) => {
                setEditHtml(html);
                setEditJson(json);
                setEditPlainText(plainText);
              }}
            />

            {/* BACKLINKS SECTION (Knowledge Graph Bidirectional Linking) */}
            <div className="border border-border/80 rounded-lg p-4 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Linked References / Backlinks ({activeBacklinks.length})
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Obsidian-style Bidirectional Graph
                </Badge>
              </div>

              {activeBacklinks.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No other notes link to this note yet. Reference this note from any other document by typing{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono">
                    [[{editTitle || "Note Title"}]]
                  </code>
                  .
                </p>
              ) : (
                <div className="space-y-2">
                  {activeBacklinks.map((bl) => {
                    const src = bl.source_note || notes.find((n) => n.id === bl.source_note_id);
                    return (
                      <div
                        key={bl.id}
                        onClick={() => {
                          if (src) {
                            handleOpenNote(src);
                          }
                        }}
                        className="p-2.5 rounded-md border border-border/70 hover:border-primary/50 bg-card cursor-pointer transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-primary flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            {src?.title || "Referencing Note"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">Click to jump</span>
                        </div>
                        {bl.context_snippet && (
                          <p className="text-[11px] text-muted-foreground italic pl-5 line-clamp-2">
                            &quot;{bl.context_snippet}&quot;
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CREATE FOLDER DIALOG */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              <span>Create New Folder</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-foreground">Folder Name</label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Research Papers, Architecture RFCs..."
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setIsNewFolderOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateFolder} disabled={isPending} className="text-xs">
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Subcomponent: Note Card
function NoteCard({
  note,
  onOpen,
  onTogglePin,
  onDelete,
}: {
  note: Note;
  onOpen: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <Card
      onClick={onOpen}
      className="border-border/80 hover:border-primary/50 transition-all hover:shadow-xs cursor-pointer group flex flex-col justify-between"
    >
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          {note.folder ? (
            <Badge variant="secondary" className="text-[10px] font-normal gap-1 bg-muted/60">
              <Folder className="h-2.5 w-2.5 text-primary" />
              <span className="truncate max-w-[120px]">{note.folder.name}</span>
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground">General</span>
          )}

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
            <button
              onClick={onTogglePin}
              className={`p-1 rounded hover:bg-muted transition-colors ${
                note.is_pinned ? "text-primary font-bold" : "text-muted-foreground"
              }`}
              title={note.is_pinned ? "Unpin note" : "Pin note to top"}
            >
              {note.is_pinned ? <Pin className="h-3.5 w-3.5 fill-primary" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
          {note.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {note.plain_text || "Empty note content..."}
        </p>

        {/* Tags & Meta Footer */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1 flex-wrap">
            {(note.tags || []).slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 rounded bg-muted/50 text-[10px] font-medium"
                style={{ color: tag.color }}
              >
                #{tag.name}
              </span>
            ))}
            {(note.tags || []).length > 2 && (
              <span className="text-muted-foreground">+{note.tags!.length - 2}</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {note.backlinks_count !== undefined && note.backlinks_count > 0 && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <Link2 className="h-3 w-3" />
                {note.backlinks_count}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {new Date(note.updated_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
