"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  FolderPlus,
  Upload,
  Bookmark as BookmarkIcon,
  FileText,
  File,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  Archive,
  Search,
  ExternalLink,
  Sparkles,
  Star,
  Trash2,
  Folder,
  Layers,
  Network,
  Target,
  FolderGit2,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getFoldersAction,
  createFolderAction,
  deleteFolderAction,
  getNotesAction,
  getFilesAction,
  createFileAction,
  deleteFileAction,
  getBookmarksAction,
  createBookmarkAction,
  deleteBookmarkAction,
  toggleFavoriteBookmarkAction,
  summarizeBookmarkWithAIAction,
  searchKnowledgeAction,
  KnowledgeSearchResults,
} from "@/actions/knowledge";
import { getProjectsAction, getGoalsAction, getTasksAction } from "@/actions/core-os";
import type {
  Folder as FolderType,
  Note,
  FileItem,
  Bookmark,
  FileCategory,
  Project,
  Goal,
  Task,
} from "@/lib/supabase/types";
import { toast } from "sonner";

export default function KnowledgePage() {
  const [isPending, startTransition] = useTransition();

  // Data states
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview");

  // Modals
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false);
  const [isNewBookmarkOpen, setIsNewBookmarkOpen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResults | null>(null);

  // File category filter
  const [selectedFileCategory, setSelectedFileCategory] = useState<string>("all");

  // Folder form
  const [folderName, setFolderName] = useState("");
  const [folderType, setFolderType] = useState<"notes" | "files" | "bookmarks" | "general">("general");
  const [folderColor, setFolderColor] = useState("#7C3AED");

  // File upload form
  const [fileName, setFileName] = useState("");
  const [fileCategory, setFileCategory] = useState<FileCategory>("document");
  const [fileUrl, setFileUrl] = useState("");
  const [fileFolderId, setFileFolderId] = useState<string | null>(null);
  const [fileProjectId, setFileProjectId] = useState<string | null>(null);
  const [fileLabels, setFileLabels] = useState("");

  // Bookmark form
  const [bmUrl, setBmUrl] = useState("");
  const [bmTitle, setBmTitle] = useState("");
  const [bmDesc, setBmDesc] = useState("");
  const [bmTags, setBmTags] = useState("");
  const [bmFolderId, setBmFolderId] = useState<string | null>(null);
  const [bmProjectId, setBmProjectId] = useState<string | null>(null);

  const loadData = () => {
    startTransition(async () => {
      const [fetchedFolders, fetchedNotes, fetchedFiles, fetchedBookmarks, fetchedProjects, fetchedGoals, fetchedTasks] =
        await Promise.all([
          getFoldersAction(),
          getNotesAction(),
          getFilesAction(),
          getBookmarksAction(),
          getProjectsAction(),
          getGoalsAction(),
          getTasksAction(),
        ]);

      setFolders(fetchedFolders);
      setNotes(fetchedNotes);
      setFiles(fetchedFiles);
      setBookmarks(fetchedBookmarks);
      setProjects(fetchedProjects);
      setGoals(fetchedGoals);
      setTasks(fetchedTasks);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Omni-search effect
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      startTransition(async () => {
        const res = await searchKnowledgeAction(searchQuery);
        setSearchResults(res);
      });
    } else {
      setSearchResults(null);
    }
  }, [searchQuery]);

  // Handlers
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    startTransition(async () => {
      const res = await createFolderAction({
        name: folderName,
        type: folderType,
        color: folderColor,
      });
      if (res.success) {
        toast.success("Folder created");
        setFolderName("");
        setIsNewFolderOpen(false);
        loadData();
      }
    });
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;
    startTransition(async () => {
      await deleteFolderAction(id);
      toast.success("Folder deleted");
      loadData();
    });
  };

  const handleCreateFile = async () => {
    if (!fileName.trim()) {
      toast.error("Please provide a file name");
      return;
    }
    const finalUrl =
      fileUrl.trim() ||
      `https://storage.wathqly.app/uploads/${fileName.toLowerCase().replace(/\s+/g, "-")}`;

    const labelsArray = fileLabels
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    startTransition(async () => {
      const res = await createFileAction({
        name: fileName,
        file_path: `/uploads/${fileName}`,
        file_url: finalUrl,
        file_type: fileCategory === "pdf" ? "application/pdf" : fileCategory === "image" ? "image/png" : "text/plain",
        file_size: 1024 * 1024 * 1.5, // 1.5 MB mock
        category: fileCategory,
        folder_id: fileFolderId,
        project_id: fileProjectId,
        labels: labelsArray,
      });
      if (res.success) {
        toast.success("File added to Knowledge Base");
        setFileName("");
        setFileUrl("");
        setFileLabels("");
        setIsUploadFileOpen(false);
        loadData();
      }
    });
  };

  const handleDeleteFile = async (id: string) => {
    startTransition(async () => {
      await deleteFileAction(id);
      toast.success("File removed");
      loadData();
    });
  };

  const handleCreateBookmark = async () => {
    if (!bmUrl.trim() || !bmTitle.trim()) {
      toast.error("URL and Title are required");
      return;
    }

    const tagsArray = bmTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    startTransition(async () => {
      const res = await createBookmarkAction({
        url: bmUrl,
        title: bmTitle,
        description: bmDesc,
        folder_id: bmFolderId,
        project_id: bmProjectId,
        tags: tagsArray,
      });
      if (res.success) {
        toast.success("Bookmark saved");
        setBmUrl("");
        setBmTitle("");
        setBmDesc("");
        setBmTags("");
        setIsNewBookmarkOpen(false);
        loadData();
      }
    });
  };

  const handleToggleFavoriteBookmark = async (id: string) => {
    startTransition(async () => {
      await toggleFavoriteBookmarkAction(id);
      loadData();
    });
  };

  const handleDeleteBookmark = async (id: string) => {
    startTransition(async () => {
      await deleteBookmarkAction(id);
      toast.success("Bookmark removed");
      loadData();
    });
  };

  const handleSummarizeWithAI = async (id: string) => {
    startTransition(async () => {
      toast.loading("Generating AI research summary...", { id: "ai-sum" });
      const res = await summarizeBookmarkWithAIAction(id);
      if (res.success) {
        toast.success("AI Summary generated!", { id: "ai-sum" });
        loadData();
      } else {
        toast.error("Failed to generate summary", { id: "ai-sum" });
      }
    });
  };

  const filteredFiles = files.filter((f) => {
    if (selectedFileCategory !== "all" && f.category !== selectedFileCategory) return false;
    return true;
  });

  const getCategoryIcon = (cat: FileCategory) => {
    switch (cat) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "image":
        return <ImageIcon className="h-4 w-4 text-info" />;
      case "video":
        return <Video className="h-4 w-4 text-purple-500" />;
      case "csv":
        return <FileSpreadsheet className="h-4 w-4 text-success" />;
      case "archive":
        return <Archive className="h-4 w-4 text-warning" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>Knowledge Base &amp; Files</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Documents, research papers, files, bookmarks, and connected bidirectional graph.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewFolderOpen(true)}
            className="gap-1.5 text-xs"
          >
            <FolderPlus className="h-3.5 w-3.5 text-primary" />
            <span>New Folder</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewBookmarkOpen(true)}
            className="gap-1.5 text-xs"
          >
            <BookmarkIcon className="h-3.5 w-3.5 text-primary" />
            <span>Add Bookmark</span>
          </Button>
          <Button size="sm" onClick={() => setIsUploadFileOpen(true)} className="gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload File</span>
          </Button>
        </div>
      </div>

      {/* Global Knowledge Omni-Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search all knowledge: notes, documents, bookmarks, tags, and research..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 text-sm bg-card border-border/80 shadow-xs"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-2 h-6 text-xs text-muted-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* SEARCH RESULTS DROPDOWN / OVERLAY */}
      {searchResults && (
        <Card className="border-primary/40 shadow-md">
          <CardHeader className="py-3 px-4 bg-primary/5 border-b border-border/60">
            <CardTitle className="text-xs font-semibold text-primary font-medium flex items-center justify-between">
              <span>Knowledge Search Results ({searchResults.totalCount} matches)</span>
              <span className="text-[10px] text-muted-foreground">Live Omni-Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {searchResults.totalCount === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                No notes, files, or bookmarks matching &quot;{searchQuery}&quot;
              </p>
            ) : (
              <>
                {searchResults.notes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Notes ({searchResults.notes.length})
                    </span>
                    {searchResults.notes.map((n) => (
                      <Link
                        key={n.id}
                        href="/notes"
                        className="block p-2 rounded border border-border/60 hover:border-primary/50 text-xs transition-colors"
                      >
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span>{n.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {n.plain_text}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.files.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Files &amp; Documents ({searchResults.files.length})
                    </span>
                    {searchResults.files.map((f) => (
                      <div
                        key={f.id}
                        className="p-2 rounded border border-border/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(f.category)}
                          <span className="font-medium text-foreground">{f.name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatFileSize(f.file_size)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.bookmarks.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Bookmarks ({searchResults.bookmarks.length})
                    </span>
                    {searchResults.bookmarks.map((b) => (
                      <div
                        key={b.id}
                        className="p-2 rounded border border-border/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <BookmarkIcon className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium text-foreground">{b.title}</span>
                          <span className="text-[10px] text-muted-foreground">({b.domain})</span>
                        </div>
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 flex-wrap h-auto">
          <TabsTrigger value="overview" className="text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs gap-1.5">
            <File className="h-3.5 w-3.5" />
            <span>Documents &amp; Files ({files.length})</span>
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="text-xs gap-1.5">
            <BookmarkIcon className="h-3.5 w-3.5" />
            <span>Bookmarks ({bookmarks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="folders" className="text-xs gap-1.5">
            <Folder className="h-3.5 w-3.5" />
            <span>Folders ({folders.length})</span>
          </TabsTrigger>
          <TabsTrigger value="graph" className="text-xs gap-1.5">
            <Network className="h-3.5 w-3.5" />
            <span>Knowledge Graph</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Total Notes</div>
                  <div className="text-2xl font-bold mt-1">{notes.length}</div>
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Files &amp; Docs</div>
                  <div className="text-2xl font-bold mt-1">{files.length}</div>
                </div>
                <div className="h-9 w-9 rounded-lg bg-info/10 text-info flex items-center justify-center">
                  <File className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Bookmarks</div>
                  <div className="text-2xl font-bold mt-1">{bookmarks.length}</div>
                </div>
                <div className="h-9 w-9 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                  <BookmarkIcon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Folders</div>
                  <div className="text-2xl font-bold mt-1">{folders.length}</div>
                </div>
                <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Folder className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Folders Showcase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Folder className="h-4 w-4 text-primary" />
                <span>Knowledge Folders</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("folders")}
                className="text-xs text-primary"
              >
                View all
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  className="border-border/80 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setActiveTab("files")}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                        {folder.type}
                      </Badge>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: folder.color }} />
                    </div>
                    <CardTitle className="text-sm font-semibold mt-2">{folder.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {notes.filter((n) => n.folder_id === folder.id).length} notes •{" "}
                      {files.filter((f) => f.folder_id === folder.id).length} files
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Notes & Recent Bookmarks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Notes */}
            <Card className="border-border/80">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Recent Notes</span>
                  </CardTitle>
                  <CardDescription className="text-xs">From your knowledge vault</CardDescription>
                </div>
                <Link href="/notes">
                  <Button variant="ghost" size="sm" className="text-xs text-primary">
                    Open Vault
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {notes.slice(0, 3).map((note) => (
                  <Link
                    key={note.id}
                    href="/notes"
                    className="block p-3 rounded-lg border border-border/60 hover:border-primary/50 transition-colors bg-card/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground truncate">{note.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {note.plain_text || "No content"}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Recent Bookmarks */}
            <Card className="border-border/80">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BookmarkIcon className="h-4 w-4 text-warning" />
                    <span>Recent Bookmarks &amp; Research</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Web references &amp; tools</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("bookmarks")}
                  className="text-xs text-primary"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {bookmarks.slice(0, 3).map((bm) => (
                  <div
                    key={bm.id}
                    className="p-3 rounded-lg border border-border/60 hover:border-primary/50 transition-colors bg-card/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={bm.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-xs text-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate"
                      >
                        <span>{bm.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                      </a>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {bm.domain}
                      </Badge>
                    </div>
                    {bm.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{bm.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. DOCUMENTS & FILES TAB */}
        <TabsContent value="files" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { label: "All Files", value: "all" },
                { label: "PDFs", value: "pdf" },
                { label: "Images", value: "image" },
                { label: "CSVs & Data", value: "csv" },
                { label: "Documents", value: "document" },
              ].map((pill) => (
                <Button
                  key={pill.value}
                  variant={selectedFileCategory === pill.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFileCategory(pill.value)}
                  className="h-7 text-xs px-3 rounded-full"
                >
                  {pill.label}
                </Button>
              ))}
            </div>

            <Button size="sm" onClick={() => setIsUploadFileOpen(true)} className="gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Document</span>
            </Button>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="border border-dashed border-border/80 rounded-xl p-12 text-center space-y-3">
              <File className="h-10 w-10 text-muted-foreground/70 mx-auto" />
              <div className="text-sm font-medium text-foreground">No files in this category</div>
              <Button size="sm" onClick={() => setIsUploadFileOpen(true)} className="text-xs">
                Upload New File
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="border-border/80 hover:border-primary/50 transition-colors">
                  <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(file.category)}
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {file.category}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Delete file"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <CardTitle className="text-xs font-semibold truncate" title={file.name}>
                      {file.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>Size: {formatFileSize(file.file_size)}</span>
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                    </div>

                    {file.labels && file.labels.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {file.labels.map((lbl, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] text-muted-foreground"
                          >
                            #{lbl}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <span>View / Download</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 3. BOOKMARKS TAB */}
        <TabsContent value="bookmarks" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Web references, articles, tools, and research papers with automated AI summaries.
            </p>
            <Button size="sm" onClick={() => setIsNewBookmarkOpen(true)} className="gap-1.5 text-xs">
              <BookmarkIcon className="h-3.5 w-3.5" />
              <span>Add Bookmark</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookmarks.map((bm) => (
              <Card
                key={bm.id}
                className="border-border/80 hover:border-primary/50 transition-colors flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      {bm.favicon_url && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={bm.favicon_url}
                          alt=""
                          className="h-4 w-4 rounded-xs shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      )}
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {bm.domain}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleFavoriteBookmark(bm.id)}
                        className={`p-1 rounded ${bm.is_favorite ? "text-warning" : "text-muted-foreground"}`}
                        title="Favorite"
                      >
                        <Star className={`h-3.5 w-3.5 ${bm.is_favorite ? "fill-amber-500" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleDeleteBookmark(bm.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive"
                        title="Delete bookmark"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sm hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    <span>{bm.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </a>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3">
                  {bm.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{bm.description}</p>
                  )}

                  {/* AI Summary Box */}
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-primary font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>AI Research Summary</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSummarizeWithAI(bm.id)}
                        className="h-5 px-1.5 text-[10px] text-primary hover:bg-primary/10 gap-1"
                      >
                        {bm.ai_summary ? "Re-summarize" : "Generate Summary"}
                      </Button>
                    </div>
                    {bm.ai_summary ? (
                      <p className="text-xs text-foreground/90 leading-relaxed">{bm.ai_summary}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Click &apos;Generate Summary&apos; to let AI synthesize key findings from this bookmark.
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {bm.tags && bm.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {bm.tags.map((t, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 4. FOLDERS TAB */}
        <TabsContent value="folders" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Organize notes, files, and bookmarks in structured workspaces.
            </p>
            <Button size="sm" onClick={() => setIsNewFolderOpen(true)} className="gap-1.5 text-xs">
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Create Folder</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => {
              const fNotes = notes.filter((n) => n.folder_id === folder.id);
              const fFiles = files.filter((f) => f.folder_id === folder.id);
              const fBookmarks = bookmarks.filter((b) => b.folder_id === folder.id);

              return (
                <Card key={folder.id} className="border-border/80 hover:border-primary/50 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: folder.color }} />
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {folder.type}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Delete folder"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <CardTitle className="text-sm font-semibold mt-2">{folder.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-2">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>📁 Notes: {fNotes.length}</div>
                      <div>📄 Documents: {fFiles.length}</div>
                      <div>🔖 Bookmarks: {fBookmarks.length}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 5. KNOWLEDGE GRAPH TAB (Section 23 Architecture) */}
        <TabsContent value="graph" className="space-y-6">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Network className="h-5 w-5 text-primary" />
                    <span>Connected Knowledge Graph</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Visual relational mapping across Goals ↔ Projects ↔ Tasks ↔ Notes ↔ Bookmarks.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  Section 23 Architecture
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Relational Graph Node Matrix (Section 23 Knowledge Graph) */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* 1. Goals Column */}
                <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-3">
                  <div className="text-xs font-bold text-primary font-medium flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    <span>Goals ({goals.length})</span>
                  </div>
                  <div className="space-y-2">
                    {goals.map((g) => (
                      <div key={g.id} className="p-2 rounded bg-muted/40 border border-border/50 text-xs">
                        <div className="font-semibold">{g.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Linked Notes: {notes.filter((n) => n.goal_id === g.id).length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Projects Column */}
                <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-3">
                  <div className="text-xs font-bold text-info font-medium flex items-center gap-1.5">
                    <FolderGit2 className="h-4 w-4" />
                    <span>Projects ({projects.length})</span>
                  </div>
                  <div className="space-y-2">
                    {projects.map((p) => (
                      <div key={p.id} className="p-2 rounded bg-muted/40 border border-border/50 text-xs">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Linked Notes: {notes.filter((n) => n.project_id === p.id).length} • Files:{" "}
                          {files.filter((f) => f.project_id === p.id).length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Tasks Column */}
                <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-3">
                  <div className="text-xs font-bold text-success font-medium flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4" />
                    <span>Tasks ({tasks.length})</span>
                  </div>
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map((t) => (
                      <div key={t.id} className="p-2 rounded bg-muted/40 border border-border/50 text-xs">
                        <div className="font-semibold truncate">{t.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Status: {t.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Notes Vault & Backlinks */}
                <div className="p-3.5 rounded-lg border border-primary/50 bg-primary/5 space-y-3">
                  <div className="text-xs font-bold text-primary font-medium flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>Notes Vault ({notes.length})</span>
                  </div>
                  <div className="space-y-2">
                    {notes.map((n) => (
                      <div key={n.id} className="p-2 rounded bg-card border border-border/60 text-xs">
                        <div className="font-semibold text-foreground truncate">{n.title}</div>
                        <div className="text-[10px] text-primary mt-0.5">
                          {n.backlinks_count || 0} Backlinks / References
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Artifacts & Bookmarks */}
                <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-3">
                  <div className="text-xs font-bold text-warning font-medium flex items-center gap-1.5">
                    <BookmarkIcon className="h-4 w-4" />
                    <span>Artifacts ({files.length + bookmarks.length})</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-muted/40 border border-border/50 text-xs">
                      <div className="font-semibold">Documents &amp; Media</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{files.length} items stored</div>
                    </div>
                    <div className="p-2 rounded bg-muted/40 border border-border/50 text-xs">
                      <div className="font-semibold">Web Bookmarks</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {bookmarks.length} references saved
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE FOLDER MODAL */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-primary" />
              <span>Create New Folder</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Folder Name</label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Legal, CertiLayer Research, Specs..."
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Folder Purpose</label>
              <select
                value={folderType}
                onChange={(e) => setFolderType(e.target.value as "notes" | "files" | "bookmarks" | "general")}
                className="w-full text-xs h-9 px-3 rounded-md border border-input bg-background"
              >
                <option value="general">General (Notes, Files, Bookmarks)</option>
                <option value="notes">Notes only</option>
                <option value="files">Files &amp; Documents only</option>
                <option value="bookmarks">Bookmarks only</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Folder Color Accent</label>
              <div className="flex items-center gap-2">
                {["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFolderColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${
                      folderColor === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
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

      {/* UPLOAD FILE MODAL */}
      <Dialog open={isUploadFileOpen} onOpenChange={setIsUploadFileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <span>Upload Document / File</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">File Name</label>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. certilayer-spec-v1.pdf"
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Category</label>
                <select
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value as FileCategory)}
                  className="w-full text-xs h-9 px-3 rounded-md border border-input bg-background"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="image">Image / Graphic</option>
                  <option value="document">General Document</option>
                  <option value="csv">CSV / Spreadsheet</option>
                  <option value="video">Video</option>
                  <option value="archive">Archive (ZIP)</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Folder</label>
                <select
                  value={fileFolderId || ""}
                  onChange={(e) => setFileFolderId(e.target.value || null)}
                  className="w-full text-xs h-9 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">No Folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Associated Project</label>
              <select
                value={fileProjectId || ""}
                onChange={(e) => setFileProjectId(e.target.value || null)}
                className="w-full text-xs h-9 px-3 rounded-md border border-input bg-background"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Labels (comma separated)</label>
              <Input
                value={fileLabels}
                onChange={(e) => setFileLabels(e.target.value)}
                placeholder="architecture, spec, compliance..."
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setIsUploadFileOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateFile} disabled={isPending} className="text-xs">
              Save File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD BOOKMARK MODAL */}
      <Dialog open={isNewBookmarkOpen} onOpenChange={setIsNewBookmarkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <BookmarkIcon className="h-4 w-4 text-primary" />
              <span>Add Bookmark / Reference</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">URL</label>
              <Input
                value={bmUrl}
                onChange={(e) => {
                  setBmUrl(e.target.value);
                  if (!bmTitle && e.target.value) {
                    try {
                      const domain = new URL(e.target.value).hostname;
                      setBmTitle(`Reference from ${domain}`);
                    } catch {
                      // ignore
                    }
                  }
                }}
                placeholder="https://example.com/research-paper"
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Title</label>
              <Input
                value={bmTitle}
                onChange={(e) => setBmTitle(e.target.value)}
                placeholder="Article / Reference title"
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Description (Optional)</label>
              <Input
                value={bmDesc}
                onChange={(e) => setBmDesc(e.target.value)}
                placeholder="Brief summary or context..."
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Folder</label>
                <select
                  value={bmFolderId || ""}
                  onChange={(e) => setBmFolderId(e.target.value || null)}
                  className="w-full text-xs h-9 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">No Folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Project</label>
                <select
                  value={bmProjectId || ""}
                  onChange={(e) => setBmProjectId(e.target.value || null)}
                  className="w-full text-xs h-9 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Tags (comma separated)</label>
              <Input
                value={bmTags}
                onChange={(e) => setBmTags(e.target.value)}
                placeholder="ai, security, compliance..."
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setIsNewBookmarkOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateBookmark} disabled={isPending} className="text-xs">
              Save Bookmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
