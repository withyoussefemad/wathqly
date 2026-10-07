"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/actions/workspace";
import { createContentItemSchema, createCampaignSchema } from "@/schemas/business";
import type { ContentItem, ContentCampaign, ContentPlatform, ContentStage } from "@/lib/supabase/types";

const demoItems: ContentItem[] = [];
const demoCampaigns: ContentCampaign[] = [];

async function resolveWorkspace() {
  const workspace = await getActiveWorkspace();
  return workspace?.id || "demo-ws-1";
}

async function getSupabaseSafe() {
  try {
    const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project"));
    return configured ? await createClient() : null;
  } catch {
    return null;
  }
}

export async function getContentItemsAction() {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("content_items").select("*, campaign(*)").eq("workspace_id", workspaceId).order("updated_at", { ascending: false });
    if (!error) return data as ContentItem[];
  }
  return demoItems.filter((item) => item.workspace_id === workspaceId);
}

export async function createContentItemAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createContentItemSchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid content data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("content_items").insert({ workspace_id: workspaceId, title: parsed.data.title, platform: parsed.data.platform, stage: parsed.data.stage, campaign_id: parsed.data.campaignId, project_id: parsed.data.projectId, scheduled_date: parsed.data.scheduledDate, content_body: parsed.data.contentBody, excerpt: parsed.data.excerpt }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/content");
    return { success: true, data };
  }
  const data = { id: `content-${Date.now()}`, workspace_id: workspaceId, title: parsed.data.title, platform: parsed.data.platform, stage: parsed.data.stage, campaign_id: parsed.data.campaignId, project_id: parsed.data.projectId, scheduled_date: parsed.data.scheduledDate, content_body: parsed.data.contentBody, excerpt: parsed.data.excerpt, metrics: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ContentItem;
  demoItems.unshift(data);
  revalidatePath("/content");
  return { success: true, data };
}

export async function updateContentStageAction(id: string, stage: ContentStage) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("content_items").update({ stage }).eq("id", id).eq("workspace_id", workspaceId).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/content");
    return { success: true, data };
  }
  const item = demoItems.find((candidate) => candidate.id === id && candidate.workspace_id === workspaceId);
  if (!item) return { success: false, message: "Content item not found" };
  item.stage = stage;
  item.updated_at = new Date().toISOString();
  revalidatePath("/content");
  return { success: true, data: item };
}

export async function deleteContentItemAction(id: string) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { error } = await supabase.from("content_items").delete().eq("id", id).eq("workspace_id", workspaceId);
    if (error) return { success: false, message: error.message };
  } else {
    const index = demoItems.findIndex((item) => item.id === id && item.workspace_id === workspaceId);
    if (index >= 0) demoItems.splice(index, 1);
  }
  revalidatePath("/content");
  return { success: true };
}

export async function getContentCampaignsAction() {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("content_campaigns").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
    if (!error) return data as ContentCampaign[];
  }
  return demoCampaigns.filter((campaign) => campaign.workspace_id === workspaceId);
}

export async function createCampaignAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createCampaignSchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid campaign data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("content_campaigns").insert({ workspace_id: workspaceId, name: parsed.data.name, description: parsed.data.description, status: parsed.data.status, start_date: parsed.data.startDate, end_date: parsed.data.endDate }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/content");
    return { success: true, data };
  }
  const data = { id: `campaign-${Date.now()}`, workspace_id: workspaceId, name: parsed.data.name, description: parsed.data.description, status: parsed.data.status, start_date: parsed.data.startDate, end_date: parsed.data.endDate, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ContentCampaign;
  demoCampaigns.unshift(data);
  revalidatePath("/content");
  return { success: true, data };
}

export async function getContentCalendarStatsAction() {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  const stats = { totalItems: 0, scheduledCount: 0, publishedCount: 0, draftCount: 0, activeCampaigns: 0, totalViews: 0, totalLikes: 0 };
  if (supabase) {
    const [items, campaigns] = await Promise.all([
      supabase.from("content_items").select("stage,metrics").eq("workspace_id", workspaceId),
      supabase.from("content_campaigns").select("id,status").eq("workspace_id", workspaceId),
    ]);
    if (!items.error && !campaigns.error) {
      const contentItems = (items.data || []) as ContentItem[];
      const contentCampaigns = (campaigns.data || []) as ContentCampaign[];
      stats.totalItems = contentItems.length;
      stats.scheduledCount = contentItems.filter((item) => item.stage === "scheduled").length;
      stats.publishedCount = contentItems.filter((item) => item.stage === "published").length;
      stats.draftCount = contentItems.filter((item) => item.stage === "draft").length;
      stats.activeCampaigns = contentCampaigns.filter((campaign) => campaign.status === "active").length;
      stats.totalViews = contentItems.reduce((sum, item) => sum + Number(item.metrics?.views || 0), 0);
      stats.totalLikes = contentItems.reduce((sum, item) => sum + Number(item.metrics?.likes || 0), 0);
      return stats;
    }
  }
  return stats;
}

export async function aiGenerateDraftAction(input: { topic: string; platform: ContentPlatform; tone: string }) {
  const title = input.topic.trim().replace(/\s+/g, " ");
  const contentBody = `${title}\n\nA focused ${input.tone} draft for ${input.platform}.\n\nStart with the customer outcome, explain the practical value, and close with one clear next action.`;
  return { success: true as const, title, contentBody, excerpt: contentBody.slice(0, 220), platform: input.platform };
}

export async function aiRepurposeContentAction(input: { sourceContent: string; targetPlatform: ContentPlatform }) {
  return { success: true as const, content: `Repurposed ${input.targetPlatform} version:\n\n${input.sourceContent.trim().slice(0, 900)}` };
}
