"use client";

import * as React from "react";
import {
  Share2,
  Plus,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Eye,
  ThumbsUp,
  Repeat,
  Trash2,
  Bot,
  Layers,
  CheckCircle2,
  Clock,
  Lightbulb,
  FileEdit,
  CheckCheck,
  Radio,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  getContentItemsAction,
  getContentCampaignsAction,
  createContentItemAction,
  updateContentStageAction,
  deleteContentItemAction,
  createCampaignAction,
  aiGenerateDraftAction,
  aiRepurposeContentAction,
  getContentCalendarStatsAction,
} from "@/actions/content";
import type {
  ContentItem,
  ContentCampaign,
  ContentPlatform,
  ContentStage,
} from "@/lib/supabase/types";

const STAGES: { id: ContentStage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "idea", label: "Ideas", icon: Lightbulb },
  { id: "draft", label: "Drafting", icon: FileEdit },
  { id: "review", label: "Review", icon: CheckCircle2 },
  { id: "scheduled", label: "Scheduled", icon: Clock },
  { id: "published", label: "Published", icon: CheckCheck },
];

const PLATFORMS: { id: ContentPlatform; label: string; color: string }[] = [
  { id: "linkedin", label: "LinkedIn", color: "bg-info/10 text-info" },
  { id: "twitter", label: "X (Twitter)", color: "bg-neutral-800/10 text-neutral-800 dark:text-neutral-200" },
  { id: "blog", label: "Engineering Blog", color: "bg-success/10 text-success" },
  { id: "youtube", label: "YouTube", color: "bg-red-600/10 text-red-600 dark:text-red-400" },
  { id: "newsletter", label: "Substack / Newsletter", color: "bg-warning/10 text-warning" },
  { id: "instagram", label: "Instagram", color: "bg-pink-600/10 text-pink-600 dark:text-pink-400" },
  { id: "tiktok", label: "TikTok", color: "bg-purple-600/10 text-purple-600 dark:text-purple-400" },
];

export default function ContentPage() {
  const [activeTab, setActiveTab] = React.useState<"pipeline" | "calendar" | "campaigns">("pipeline");
  const [items, setItems] = React.useState<ContentItem[]>([]);
  const [campaigns, setCampaigns] = React.useState<ContentCampaign[]>([]);
  const [stats, setStats] = React.useState({
    totalItems: 0,
    scheduledCount: 0,
    publishedCount: 0,
    draftCount: 0,
    activeCampaigns: 0,
    totalViews: 0,
    totalLikes: 0,
  });
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>("all");

  // Dialogs
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openAiStudio, setOpenAiStudio] = React.useState(false);
  const [openCampaignModal, setOpenCampaignModal] = React.useState(false);

  // Create Content Form
  const [title, setTitle] = React.useState("");
  const [platform, setPlatform] = React.useState<ContentPlatform>("linkedin");
  const [stage, setStage] = React.useState<ContentStage>("idea");
  const [campaignId, setCampaignId] = React.useState("");
  const [scheduledDate, setScheduledDate] = React.useState("");
  const [contentBody, setContentBody] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");

  // Create Campaign Form
  const [campName, setCampName] = React.useState("");
  const [campDesc, setCampDesc] = React.useState("");

  // AI Studio Form
  const [aiTopic, setAiTopic] = React.useState("");
  const [aiPlatform, setAiPlatform] = React.useState<ContentPlatform>("linkedin");
  const [aiTone, setAiTone] = React.useState<"professional" | "thought-provoking" | "casual" | "bold">("thought-provoking");
  const [aiGeneratedOutput, setAiGeneratedOutput] = React.useState<{
    title: string;
    contentBody: string;
    excerpt: string;
    platform: ContentPlatform;
  } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Repurpose Form
  const [repurposeSourceText, setRepurposeSourceText] = React.useState("");
  const [repurposeTargetPlatform, setRepurposeTargetPlatform] = React.useState<ContentPlatform>("twitter");
  const [repurposeResult, setRepurposeResult] = React.useState<string>("");

  const loadData = React.useCallback(async () => {
    try {
      const [itemsData, campaignsData, statsData] = await Promise.all([
        getContentItemsAction(),
        getContentCampaignsAction(),
        getContentCalendarStatsAction(),
      ]);
      setItems(itemsData);
      setCampaigns(campaignsData);
      setStats(statsData);
    } catch {
      toast.error("Failed to load content data");
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const res = await createContentItemAction({
      title: title.trim(),
      platform,
      stage,
      campaignId: campaignId || null,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      contentBody: contentBody.trim() || undefined,
      excerpt: excerpt.trim() || undefined,
    });

    if (res.success && res.data) {
      toast.success("Content item created");
      setOpenCreateModal(false);
      setTitle("");
      setContentBody("");
      setExcerpt("");
      loadData();
    } else {
      toast.error("Failed to create content item");
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) {
      toast.error("Please enter campaign name");
      return;
    }

    const res = await createCampaignAction({
      name: campName.trim(),
      description: campDesc.trim() || undefined,
      status: "active",
    });

    if (res.success) {
      toast.success("Campaign created");
      setOpenCampaignModal(false);
      setCampName("");
      setCampDesc("");
      loadData();
    } else {
      toast.error("Failed to create campaign");
    }
  };

  const handleStageChange = async (contentId: string, newStage: ContentStage) => {
    setItems((prev) =>
      prev.map((item) => (item.id === contentId ? { ...item, stage: newStage } : item))
    );

    const res = await updateContentStageAction(contentId, newStage);
    if (res.success) {
      toast.success(`Content moved to ${newStage.toUpperCase()}`);
      loadData();
    } else {
      toast.error("Failed to update stage");
      loadData();
    }
  };

  const handleDeleteContent = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteContentItemAction(id);
    toast.success("Content deleted");
    loadData();
  };

  // AI Actions
  const handleAiGenerateDraft = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await aiGenerateDraftAction({
        topic: aiTopic.trim(),
        platform: aiPlatform,
        tone: aiTone,
      });

      if (res.success && res.contentBody) {
        setAiGeneratedOutput({
          title: res.title || `Mastering ${aiTopic}`,
          contentBody: res.contentBody,
          excerpt: res.excerpt || "",
          platform: aiPlatform,
        });
        toast.success("Draft generated!");
      }
    } catch {
      toast.error("Error generating draft");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAiDraftToCalendar = async () => {
    if (!aiGeneratedOutput) return;

    const res = await createContentItemAction({
      title: aiGeneratedOutput.title,
      platform: aiGeneratedOutput.platform,
      stage: "draft",
      contentBody: aiGeneratedOutput.contentBody,
      excerpt: aiGeneratedOutput.excerpt,
    });

    if (res.success) {
      toast.success("Draft saved to Content Calendar!");
      setOpenAiStudio(false);
      setAiGeneratedOutput(null);
      loadData();
    }
  };

  const handleAiRepurpose = async () => {
    if (!repurposeSourceText.trim()) {
      toast.error("Please enter source content");
      return;
    }

    try {
      const res = await aiRepurposeContentAction({
        sourceContent: repurposeSourceText,
        targetPlatform: repurposeTargetPlatform,
      });

      if (res.success && res.content) {
        setRepurposeResult(res.content);
        toast.success("Repurposed successfully!");
      }
    } catch {
      toast.error("Failed to repurpose");
    }
  };

  // Filtered items
  const filteredItems = React.useMemo(() => {
    if (selectedPlatform === "all") return items;
    return items.filter((i) => i.platform === selectedPlatform);
  }, [items, selectedPlatform]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Share2 className="h-6 w-6 text-primary" />
            <span>Content Pipeline &amp; Calendar</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Section 16 Content Engine: Multi-channel lifecycle, campaign goal alignment, and AI draft generation.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
            onClick={() => setOpenAiStudio(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Content Studio</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setOpenCampaignModal(true)}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>New Campaign</span>
          </Button>
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setOpenCreateModal(true)}
          >
            <Plus className="h-4 w-4" />
            <span>New Content</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="pb-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Total Pipeline</span>
              <FileEdit className="h-3.5 w-3.5 text-primary" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono">
              {stats.totalItems} Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {stats.draftCount} ideas &amp; drafts in progress
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Scheduled Queue</span>
              <Clock className="h-3.5 w-3.5 text-info" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-info">
              {stats.scheduledCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Ready for publishing
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Published &amp; Live</span>
              <CheckCheck className="h-3.5 w-3.5 text-success" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono text-success">
              {stats.publishedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Delivered across channels
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              <span>Audience Reach</span>
              <TrendingUp className="h-3.5 w-3.5 text-warning" />
            </span>
            <CardTitle className="text-2xl font-bold font-mono">
              {stats.totalViews.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Total impressions &amp; views
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Platform Filter */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pipeline" | "calendar" | "campaigns")} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <TabsList className="bg-secondary/40">
            <TabsTrigger value="pipeline" className="gap-2 text-xs">
              <Layers className="h-3.5 w-3.5" />
              <span>Lifecycle Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span>Publishing Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2 text-xs">
              <Radio className="h-3.5 w-3.5" />
              <span>Strategic Campaigns ({campaigns.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Platform Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={selectedPlatform === "all" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSelectedPlatform("all")}
            >
              All Platforms
            </Button>
            {PLATFORMS.slice(0, 4).map((p) => (
              <Button
                key={p.id}
                variant={selectedPlatform === p.id ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setSelectedPlatform(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 1. LIFECYCLE PIPELINE (KANBAN) */}
        <TabsContent value="pipeline" className="m-0">
          <div className="overflow-x-auto pb-4">
            <div className="inline-flex gap-3 min-w-full">
              {STAGES.map((stg) => {
                const stageItems = filteredItems.filter((i) => i.stage === stg.id);
                const StageIcon = stg.icon;

                return (
                  <div
                    key={stg.id}
                    className="w-72 shrink-0 bg-secondary/20 rounded-xl border border-border/60 flex flex-col max-h-[750px]"
                  >
                    {/* Column Header */}
                    <div className="p-3 border-b border-border/40 bg-card/40 rounded-t-xl flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <StageIcon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold font-medium text-foreground">
                          {stg.label}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {stageItems.length}
                      </Badge>
                    </div>

                    {/* Cards */}
                    <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                      {stageItems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground/60 border border-dashed border-border/40 rounded-lg">
                          No items in {stg.label}
                        </div>
                      ) : (
                        stageItems.map((item) => {
                          const pInfo = PLATFORMS.find((p) => p.id === item.platform);
                          const currentIndex = STAGES.findIndex((s) => s.id === item.stage);

                          return (
                            <Card
                              key={item.id}
                              className="p-3 bg-card border-border/70 hover:border-primary/50 shadow-sm transition-all group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pInfo?.color || "bg-secondary text-foreground"}`}>
                                  {pInfo?.label || item.platform}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="text-xs">
                                    <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground">
                                      Advance Lifecycle
                                    </div>
                                    {STAGES.map((s) => (
                                      <DropdownMenuItem
                                        key={s.id}
                                        onClick={() => handleStageChange(item.id, s.id)}
                                        className={item.stage === s.id ? "font-bold text-primary" : ""}
                                      >
                                        {s.label}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteContent(item.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      Delete Item
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <p className="text-xs font-semibold text-foreground mt-2 line-clamp-2 leading-snug">
                                {item.title}
                              </p>

                              {item.content_body && (
                                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                                  {item.content_body}
                                </p>
                              )}

                              {/* Connections info */}
                              <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                                {item.scheduled_date ? (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(item.scheduled_date).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                ) : (
                                  <span>Unscheduled</span>
                                )}

                                {item.campaign && (
                                  <span className="truncate max-w-[100px] font-medium text-foreground">
                                    {item.campaign.name}
                                  </span>
                                )}
                              </div>

                              {/* Analytics bar if published */}
                              {item.stage === "published" && item.metrics && (
                                <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {item.metrics.views || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" />
                                    {item.metrics.likes || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Repeat className="h-3 w-3" />
                                    {item.metrics.shares || 0}
                                  </span>
                                </div>
                              )}

                              {/* Quick Move Next Button */}
                              {currentIndex < STAGES.length - 1 && (
                                <div className="mt-2 pt-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 w-full text-[10px] gap-1 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleStageChange(item.id, STAGES[currentIndex + 1].id)}
                                  >
                                    <span>Move to {STAGES[currentIndex + 1].label}</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* 2. EDITORIAL CALENDAR SCHEDULE VIEW */}
        <TabsContent value="calendar" className="m-0">
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Publishing Timeline</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target distribution dates, scheduled posts, and release cadence across channels.
              </p>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No content items created yet.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Share2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {item.platform}
                          </Badge>
                          <Badge
                            variant={item.stage === "published" ? "success" : item.stage === "scheduled" ? "accent" : "secondary"}
                            className="text-[10px] capitalize"
                          >
                            {item.stage}
                          </Badge>
                        </div>
                        {item.excerpt && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.excerpt}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {item.scheduled_date
                          ? new Date(item.scheduled_date).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })
                          : "No Target Date"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteContent(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. CAMPAIGNS VIEW */}
        <TabsContent value="campaigns" className="m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => {
              const campItems = items.filter((i) => i.campaign_id === camp.id);
              const published = campItems.filter((i) => i.stage === "published").length;

              return (
                <Card key={camp.id} className="border-border/80">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {camp.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {camp.start_date || "Continuous"} → {camp.end_date || "Ongoing"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {camp.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {camp.description && (
                      <p className="text-muted-foreground leading-relaxed">{camp.description}</p>
                    )}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span>
                        <strong className="text-foreground">{campItems.length}</strong> content pieces
                      </span>
                      <span>
                        <strong className="text-success">{published}</strong> published
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* CREATE CONTENT ITEM DIALOG */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="sm:max-w-[520px]">
          <form onSubmit={handleCreateContent}>
            <DialogHeader>
              <DialogTitle className="text-lg">New Content Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Title / Hook</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Why Founders Choose Unified Personal Operating Systems"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Lifecycle Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as ContentStage)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Campaign (Optional)</label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">None</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Target Date</label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Content Body / Draft</label>
                <textarea
                  value={contentBody}
                  onChange={(e) => setContentBody(e.target.value)}
                  placeholder="Write draft content or bullet points here..."
                  className="w-full min-h-[120px] rounded-md border border-input bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Create Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE CAMPAIGN DIALOG */}
      <Dialog open={openCampaignModal} onOpenChange={setOpenCampaignModal}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreateCampaign}>
            <DialogHeader>
              <DialogTitle className="text-lg">Create Strategic Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Campaign Name</label>
                <Input
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Q4 Executive Leadership Series"
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Description &amp; Strategic Goal</label>
                <textarea
                  value={campDesc}
                  onChange={(e) => setCampDesc(e.target.value)}
                  placeholder="Target outcome, themes, and narrative arc..."
                  className="w-full min-h-[90px] rounded-md border border-input bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenCampaignModal(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Create Campaign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI CONTENT STUDIO MODAL (Section 16: Draft Generation & Repurposing) */}
      <Dialog open={openAiStudio} onOpenChange={setOpenAiStudio}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>AI Content Studio</span>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="generator" className="w-full text-xs">
            <TabsList className="w-full grid grid-cols-2 bg-secondary/40">
              <TabsTrigger value="generator">Draft Generator</TabsTrigger>
              <TabsTrigger value="repurpose">Repurpose Post</TabsTrigger>
            </TabsList>

            {/* TAB 1: DRAFT GENERATOR */}
            <TabsContent value="generator" className="space-y-4 pt-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Topic or Core Idea</label>
                <Input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Why unified workspace architecture beats 10 disconnected SaaS apps"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Target Platform</label>
                  <select
                    value={aiPlatform}
                    onChange={(e) => setAiPlatform(e.target.value as ContentPlatform)}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Tone of Voice</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value as "thought-provoking" | "professional" | "bold" | "casual")}
                    className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="thought-provoking">Thought-Provoking</option>
                    <option value="professional">Professional &amp; Authoritative</option>
                    <option value="bold">Bold &amp; Direct</option>
                    <option value="casual">Casual &amp; Conversational</option>
                  </select>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAiGenerateDraft}
                disabled={isGenerating}
                className="w-full gap-2 text-xs"
              >
                <Bot className="h-4 w-4" />
                <span>{isGenerating ? "Synthesizing Draft..." : "Generate Platform Draft"}</span>
              </Button>

              {aiGeneratedOutput && (
                <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{aiGeneratedOutput.title}</span>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {aiGeneratedOutput.platform}
                    </Badge>
                  </div>
                  <div className="whitespace-pre-wrap text-foreground text-xs leading-relaxed bg-card p-3 rounded-lg border border-border/50">
                    {aiGeneratedOutput.contentBody}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveAiDraftToCalendar}
                    className="w-full gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Draft to Content Calendar</span>
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: REPURPOSE POST */}
            <TabsContent value="repurpose" className="space-y-4 pt-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Source Content (Article, Note, or Blog Post)</label>
                <textarea
                  value={repurposeSourceText}
                  onChange={(e) => setRepurposeSourceText(e.target.value)}
                  placeholder="Paste existing long-form article or meeting summary here..."
                  className="w-full min-h-[100px] rounded-md border border-input bg-card p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Repurpose Into</label>
                <select
                  value={repurposeTargetPlatform}
                  onChange={(e) => setRepurposeTargetPlatform(e.target.value as ContentPlatform)}
                  className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="twitter">X / Twitter Thread</option>
                  <option value="linkedin">LinkedIn Executive Summary</option>
                  <option value="newsletter">Email Newsletter Snippet</option>
                </select>
              </div>

              <Button
                type="button"
                onClick={handleAiRepurpose}
                className="w-full gap-2 text-xs"
              >
                <Repeat className="h-4 w-4" />
                <span>Repurpose Content</span>
              </Button>

              {repurposeResult && (
                <div className="mt-4 p-4 rounded-xl border border-border/80 bg-card space-y-2">
                  <span className="font-bold text-foreground">Repurposed Content:</span>
                  <div className="whitespace-pre-wrap text-foreground text-xs leading-relaxed bg-secondary/20 p-3 rounded-lg">
                    {repurposeResult}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
