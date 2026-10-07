"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/actions/workspace";
import { runAutomationTriggerAction } from "@/actions/automation";
import {
  createCompanySchema,
  createContactSchema,
  createDealSchema,
  createActivitySchema,
  updateDealStageSchema,
} from "@/schemas/business";
import type {
  Company,
  Contact,
  Deal,
  CrmActivity,
  CrmStats,
} from "@/lib/supabase/types";

const demoCompanies: Company[] = [
  {
    id: "company-demo-1", workspace_id: "demo-ws-1", name: "CertiLayer", domain: "certilayer.example",
    industry: "AI", size: "11-50", status: "customer", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];
const demoContacts: Contact[] = [
  {
    id: "contact-demo-1", workspace_id: "demo-ws-1", first_name: "Youssef", last_name: "Emad",
    email: "youssef@example.com", phone: null, title: "Founder", company_id: "company-demo-1",
    status: "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];
const demoDeals: Deal[] = [
  {
    id: "deal-demo-1", workspace_id: "demo-ws-1", title: "Enterprise workspace rollout", value: 25000,
    stage: "proposal", priority: "high", company_id: "company-demo-1", contact_id: "contact-demo-1",
    description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];
const demoActivities: CrmActivity[] = [
  {
    id: "activity-demo-1", workspace_id: "demo-ws-1", title: "Send revised proposal", type: "email",
    deal_id: "deal-demo-1", due_date: new Date(Date.now() + 86400000).toISOString(), completed: false,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

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

export async function getCompaniesAction() {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("companies").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
    if (!error) return data as Company[];
  }
  return demoCompanies.filter((item) => item.workspace_id === workspaceId);
}

export async function createCompanyAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createCompanySchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid company data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("companies").insert({ workspace_id: workspaceId, name: parsed.data.name, domain: parsed.data.domain, industry: parsed.data.industry, size: parsed.data.size, status: parsed.data.status }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/crm");
    return { success: true, data };
  }
  const data = { id: `company-${Date.now()}`, workspace_id: workspaceId, ...parsed.data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Company;
  demoCompanies.unshift(data);
  revalidatePath("/crm");
  return { success: true, data };
}

export async function deleteCompanyAction(id: string) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { error } = await supabase.from("companies").delete().eq("id", id).eq("workspace_id", workspaceId);
    if (error) return { success: false, message: error.message };
  } else {
    const index = demoCompanies.findIndex((item) => item.id === id && item.workspace_id === workspaceId);
    if (index >= 0) demoCompanies.splice(index, 1);
  }
  revalidatePath("/crm");
  return { success: true };
}

export async function getContactsAction() {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("contacts").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
    if (!error) return data as Contact[];
  }
  return demoContacts.filter((item) => item.workspace_id === workspaceId);
}

export async function createContactAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createContactSchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid contact data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("contacts").insert({ workspace_id: workspaceId, first_name: parsed.data.firstName, last_name: parsed.data.lastName, email: parsed.data.email, phone: parsed.data.phone, title: parsed.data.title, company_id: parsed.data.companyId, status: parsed.data.status }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/crm");
    return { success: true, data };
  }
  const data = { id: `contact-${Date.now()}`, workspace_id: workspaceId, first_name: parsed.data.firstName, last_name: parsed.data.lastName, email: parsed.data.email, phone: parsed.data.phone, title: parsed.data.title, company_id: parsed.data.companyId, status: parsed.data.status, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Contact;
  demoContacts.unshift(data);
  revalidatePath("/crm");
  return { success: true, data };
}

export async function deleteContactAction(id: string) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { error } = await supabase.from("contacts").delete().eq("id", id).eq("workspace_id", workspaceId);
    if (error) return { success: false, message: error.message };
  } else {
    const index = demoContacts.findIndex((item) => item.id === id && item.workspace_id === workspaceId);
    if (index >= 0) demoContacts.splice(index, 1);
  }
  revalidatePath("/crm");
  return { success: true };
}

export async function getDealsAction() {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("deals").select("*, company(*), contact(*)").eq("workspace_id", workspaceId).order("updated_at", { ascending: false });
    if (!error) return data as Deal[];
  }
  return demoDeals.filter((item) => item.workspace_id === workspaceId);
}

export async function createDealAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createDealSchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid deal data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("deals").insert({ workspace_id: workspaceId, title: parsed.data.title, value: parsed.data.value, stage: parsed.data.stage, company_id: parsed.data.companyId, contact_id: parsed.data.contactId, priority: parsed.data.priority, description: parsed.data.description }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/crm");
    return { success: true, data };
  }
  const data: Deal = {
    id: `deal-${Date.now()}`,
    workspace_id: workspaceId,
    title: parsed.data.title,
    value: parsed.data.value,
    stage: parsed.data.stage,
    priority: parsed.data.priority,
    company_id: parsed.data.companyId ?? null,
    contact_id: parsed.data.contactId ?? null,
    description: parsed.data.description ?? null,
    status: parsed.data.stage === "won" ? "won" : parsed.data.stage === "lost" ? "lost" : "open",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  demoDeals.unshift(data);
  revalidatePath("/crm");
  return { success: true, data };
}

export async function updateDealStageAction(id: string, stage: string) {
  const workspaceId = await resolveWorkspace();
  const parsed = updateDealStageSchema.safeParse({ stage });
  if (!parsed.success) return { success: false, message: "Invalid deal stage" };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("deals").update({ stage: parsed.data.stage, status: parsed.data.stage === "won" ? "won" : parsed.data.stage === "lost" ? "lost" : "open" }).eq("id", id).eq("workspace_id", workspaceId).select().single();
    if (error) return { success: false, message: error.message };
    try {
      await runAutomationTriggerAction("deal_stage_changed", data as unknown as Record<string, unknown>);
    } catch {
      // Automation failures must not roll back a deal update.
    }
    revalidatePath("/crm");
    return { success: true, data };
  }
  const deal = demoDeals.find((item) => item.id === id && item.workspace_id === workspaceId);
  if (!deal) return { success: false, message: "Deal not found" };
  deal.stage = parsed.data.stage as Deal["stage"];
  deal.updated_at = new Date().toISOString();
  revalidatePath("/crm");
  return { success: true, data: deal };
}

export async function deleteDealAction(id: string) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { error } = await supabase.from("deals").delete().eq("id", id).eq("workspace_id", workspaceId);
    if (error) return { success: false, message: error.message };
  } else {
    const index = demoDeals.findIndex((item) => item.id === id && item.workspace_id === workspaceId);
    if (index >= 0) demoDeals.splice(index, 1);
  }
  revalidatePath("/crm");
  return { success: true };
}

export async function getCrmActivitiesAction() {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("crm_activities").select("*").eq("workspace_id", workspaceId).order("due_date", { ascending: true });
    if (!error) return data as CrmActivity[];
  }
  return demoActivities.filter((item) => item.workspace_id === workspaceId);
}

export async function createCrmActivityAction(input: Record<string, unknown>) {
  const workspaceId = await resolveWorkspace();
  const parsed = createActivitySchema.safeParse({ ...input, workspaceId });
  if (!parsed.success) return { success: false, message: "Invalid activity data", errors: parsed.error.flatten().fieldErrors };
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("crm_activities").insert({ workspace_id: workspaceId, title: parsed.data.title, type: parsed.data.type, deal_id: parsed.data.dealId, due_date: parsed.data.dueDate, completed: parsed.data.completed }).select().single();
    if (error) return { success: false, message: error.message };
    revalidatePath("/crm");
    return { success: true, data };
  }
  const data = { id: `activity-${Date.now()}`, workspace_id: workspaceId, title: parsed.data.title, type: parsed.data.type, deal_id: parsed.data.dealId, due_date: parsed.data.dueDate, completed: parsed.data.completed, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CrmActivity;
  demoActivities.unshift(data);
  revalidatePath("/crm");
  return { success: true, data };
}

export async function toggleCrmActivityAction(id: string) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { data, error } = await supabase.from("crm_activities").update({ completed: true }).eq("id", id).eq("workspace_id", workspaceId).select().single();
    if (error) return { success: false, message: error.message };
    return { success: true, data };
  }
  const activity = demoActivities.find((item) => item.id === id && item.workspace_id === workspaceId);
  if (!activity) return { success: false, message: "Activity not found" };
  activity.completed = !activity.completed;
  return { success: true, data: activity };
}

export async function deleteCrmActivityAction(id: string) {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  if (supabase) {
    const { error } = await supabase.from("crm_activities").delete().eq("id", id).eq("workspace_id", workspaceId);
    if (error) return { success: false, message: error.message };
  } else {
    const index = demoActivities.findIndex((item) => item.id === id && item.workspace_id === workspaceId);
    if (index >= 0) demoActivities.splice(index, 1);
  }
  revalidatePath("/crm");
  return { success: true };
}

export async function getCrmStatsAction() {
  const workspaceId = await resolveWorkspace();
  const supabase = await getSupabaseSafe();
  const stats: CrmStats = { totalPipelineValue: 0, totalWonValue: 0, openDealsCount: 0, wonDealsCount: 0, totalContacts: 0, totalCompanies: 0, pendingActivities: 0 };
  if (supabase) {
    const [deals, contacts, companies, activities] = await Promise.all([
      supabase.from("deals").select("value,stage").eq("workspace_id", workspaceId),
      supabase.from("contacts").select("id").eq("workspace_id", workspaceId),
      supabase.from("companies").select("id").eq("workspace_id", workspaceId),
      supabase.from("crm_activities").select("completed").eq("workspace_id", workspaceId),
    ]);
    if (!deals.error && !contacts.error && !companies.error && !activities.error) {
      const values = (deals.data || []) as Array<{ value: number; stage: string }>;
      const activityRows = (activities.data || []) as Array<{ completed: boolean }>;
      stats.totalPipelineValue = values.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
      stats.totalWonValue = values.filter((deal) => deal.stage === "won").reduce((sum, deal) => sum + Number(deal.value || 0), 0);
      stats.openDealsCount = values.filter((deal) => !["won", "lost"].includes(deal.stage)).length;
      stats.wonDealsCount = values.filter((deal) => deal.stage === "won").length;
      stats.totalContacts = contacts.data?.length || 0;
      stats.totalCompanies = companies.data?.length || 0;
      stats.pendingActivities = activityRows.filter((activity) => !activity.completed).length;
      return stats;
    }
  }
  const deals = demoDeals.filter((item) => item.workspace_id === workspaceId);
  stats.totalPipelineValue = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  stats.totalWonValue = deals.filter((deal) => deal.stage === "won").reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  stats.openDealsCount = deals.filter((deal) => !["won", "lost"].includes(deal.stage)).length;
  stats.wonDealsCount = deals.filter((deal) => deal.stage === "won").length;
  stats.totalContacts = demoContacts.filter((item) => item.workspace_id === workspaceId).length;
  stats.totalCompanies = demoCompanies.filter((item) => item.workspace_id === workspaceId).length;
  stats.pendingActivities = demoActivities.filter((item) => item.workspace_id === workspaceId && !item.completed).length;
  return stats;
}
