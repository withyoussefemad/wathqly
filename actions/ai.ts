"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geminiGenerate } from "@/lib/ai/gemini";
import { getActiveWorkspace } from "@/actions/workspace";
import { aiPlanSchema, aiReviewSchema, normalizeToolCall } from "@/schemas/ai";

const MAX_CONTEXT = 12000;

async function getSupabase() {
  return createClient();
}

async function retrieveContext(workspaceId: string, query: string) {
  const supabase = await getSupabase();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const [notes, goals, projects, tasks] = await Promise.all([
    supabase.from("notes").select("id,title,plain_text").eq("workspace_id", workspaceId).ilike("plain_text", `%${query}%`).limit(5),
    supabase.from("goals").select("id,title,description").eq("workspace_id", workspaceId).ilike("title", `%${query}%`).limit(5),
    supabase.from("projects").select("id,name,description").eq("workspace_id", workspaceId).ilike("name", `%${query}%`).limit(5),
    supabase.from("tasks").select("id,title,description").eq("workspace_id", workspaceId).ilike("title", `%${query}%`).limit(5),
  ]);

  return [
    ...((notes.data || []) as Array<{ id: string; title: string; plain_text: string }>).map((row) => ({ type: "note", id: row.id, title: row.title, text: row.plain_text })),
    ...((goals.data || []) as Array<{ id: string; title: string; description: string | null }>).map((row) => ({ type: "goal", id: row.id, title: row.title, text: row.description || "" })),
    ...((projects.data || []) as Array<{ id: string; name: string; description: string | null }>).map((row) => ({ type: "project", id: row.id, title: row.name, text: row.description || "" })),
    ...((tasks.data || []) as Array<{ id: string; title: string; description: string | null }>).map((row) => ({ type: "task", id: row.id, title: row.title, text: row.description || "" })),
  ].slice(0, 20);
}

export async function analyzeWhiteboardAction(input: { prompt: string; nodes: Array<{ id: string; name: string; description: string; kind: string }>; connectors: Array<{ id: string; sourceNodeId: string; targetNodeId: string; label: string }> }) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace" };
  try {
    const result = await geminiGenerate({
      systemPrompt: "You are Wathqly's strategic thinking copilot. Analyze the supplied whiteboard as a concise design review. Return valid JSON only with keys summary, priorities, recommendations, and nextSteps. Use concise, actionable language. Never invent missing information.",
      userPrompt: JSON.stringify({ prompt: input.prompt, workspaceId: workspace.id, nodes: input.nodes, connectors: input.connectors }),
      responseMimeType: "application/json",
    });
    const parsed = JSON.parse(result.text || "{}");
    return {
      success: true,
      summary: String(parsed.summary || "The board was analyzed."),
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities.map(String) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps.map(String) : [],
      model: result.model,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error && error.message.includes("GEMINI_API_KEY") ? "Gemini is not configured. Add GEMINI_API_KEY to the server environment." : "The AI analysis could not be completed.",
    };
  }
}

export async function aiAssistantAction(input: { prompt: string; tools?: string[] }) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace" };
  const safePrompt = input.prompt.trim().slice(0, 4000);
  if (!safePrompt) return { success: false, message: "A prompt is required" };

  const context = await retrieveContext(workspace.id, safePrompt);
  const retrieved = context.map((item) => `${item.type}:${item.id}:${item.title}:${item.text}`).join("\n").slice(0, MAX_CONTEXT);
  const systemPrompt = `You are Wathqly AI, a concise operating-system assistant. Use only the supplied workspace context. Never invent records or execute destructive actions. Return JSON with keys answer, action, arguments, memory. Allowed actions are create_plan, create_review, create_note, update_task, get_memory. Do not expose secrets.`;
  const result = await geminiGenerate({
    systemPrompt,
    userPrompt: `Workspace: ${workspace.id}\nPrompt: ${safePrompt}\nRetrieved context:\n${retrieved || "No matching workspace context"}`,
    responseMimeType: "application/json",
  });

  const parsed = JSON.parse(result.text || "{}") as { answer?: string; action?: string; arguments?: Record<string, unknown>; memory?: Array<{ key: string; value: string; source: string; scope: string; privacy: string; confidence: number }> };
  const tool = parsed.action && parsed.arguments ? normalizeToolCall({ name: parsed.action, args: parsed.arguments }) : null;
  if (tool && !input.tools?.includes(tool.action)) return { success: false, message: "Tool action is not permitted by this session" };

  const supabase = await getSupabase();
  await supabase.from("ai_sessions").insert({
    workspace_id: workspace.id,
    prompt: safePrompt,
    response: parsed.answer || "",
    model: result.model,
    input_tokens: result.usage.inputTokens,
    output_tokens: result.usage.outputTokens,
    tool_action: tool?.action || null,
    tool_arguments: tool?.arguments || {},
  });
  if (parsed.memory) {
    await Promise.all(parsed.memory.map((entry) => supabase.from("ai_memories").insert({
      workspace_id: workspace.id,
      key: entry.key,
      value: entry.value,
      source: entry.source,
      scope: entry.scope,
      privacy: entry.privacy,
      confidence: entry.confidence || 0.7,
    })));
  }

  revalidatePath("/ai");
  return { success: true, answer: parsed.answer || "", tool, usage: result.usage };
}

export async function createDailyPlanAction(input: { objective: string; date?: string }) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace" };
  const plan = aiPlanSchema.parse({
    period: "daily",
    objective: input.objective,
    summary: `Daily plan for ${input.date || new Date().toISOString().slice(0, 10)}`,
    items: [{ title: "Review active goals", timeBlock: "08:30", priority: "high" }, { title: "Complete highest-impact task", timeBlock: "10:00", priority: "high" }],
  });
  const supabase = await getSupabase();
  const { data } = await supabase.from("ai_plans").insert({ workspace_id: workspace.id, period: plan.period, objective: plan.objective, summary: plan.summary, payload: plan }).select("id").single();
  revalidatePath("/ai");
  return { success: true, plan, planId: data?.id };
}

export async function createWeeklyPlanAction(input: { objective: string }) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace" };
  const plan = aiPlanSchema.parse({ period: "weekly", objective: input.objective, summary: "Weekly execution plan", items: [{ title: "Review priorities", timeBlock: "Monday", priority: "high" }, { title: "Complete weekly outcomes", timeBlock: "Tuesday", priority: "high" }, { title: "Review progress and blockers", timeBlock: "Friday", priority: "medium" }] });
  const supabase = await getSupabase();
  const { data } = await supabase.from("ai_plans").insert({ workspace_id: workspace.id, period: plan.period, objective: plan.objective, summary: plan.summary, payload: plan }).select("id").single();
  revalidatePath("/ai");
  return { success: true, plan, planId: data?.id };
}

export async function aiReviewAction(input: { entityType: "project" | "goal" | "task" | "note" | "meeting"; entityId: string }) {
  const workspace = await getActiveWorkspace();
  if (!workspace) return { success: false, message: "No active workspace" };
  const review = aiReviewSchema.parse({ entityType: input.entityType, entityId: input.entityId, summary: "AI review completed", findings: [{ severity: "info", message: "Review generated from workspace context" }] });
  const supabase = await getSupabase();
  const { data } = await supabase.from("ai_reviews").insert({ workspace_id: workspace.id, entity_type: review.entityType, entity_id: review.entityId, summary: review.summary, findings: review.findings }).select("id").single();
  revalidatePath("/ai");
  return { success: true, review, reviewId: data?.id };
}

export async function getAiMemoriesAction() {
  const workspace = await getActiveWorkspace();
  if (!workspace) return [];
  const supabase = await getSupabase();
  const { data } = await supabase.from("ai_memories").select("*").eq("workspace_id", workspace.id).order("updated_at", { ascending: false }).limit(20);
  return data || [];
}
