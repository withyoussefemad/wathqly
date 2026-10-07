import { describe, expect, it } from "vitest";
import { aiActionSchema, aiPlanSchema, aiReviewSchema, normalizeToolCall } from "@/schemas/ai";

describe("Phase 5 AI contracts", () => {
  it("accepts safe AI actions and rejects unknown tool names", () => {
    const action = aiActionSchema.parse({
      action: "create_plan",
      arguments: { period: "daily", objective: "Complete the core workflow" },
    });
    expect(action.action).toBe("create_plan");
    expect(() => aiActionSchema.parse({ action: "drop_database", arguments: {} })).toThrow();
  });

  it("normalizes a safe Gemini tool call", () => {
    expect(normalizeToolCall({
      name: "create_plan",
      args: { period: "weekly", objective: "Review the week" },
    })).toEqual({
      action: "create_plan",
      arguments: { period: "weekly", objective: "Review the week" },
    });
  });

  it("validates generated plan and review payloads", () => {
    const plan = aiPlanSchema.parse({
      period: "daily",
      objective: "Prioritize work",
      summary: "Review today",
      items: [{ title: "Review goals", timeBlock: "09:00", priority: "high" }],
    });
    const review = aiReviewSchema.parse({
      entityType: "project",
      entityId: "00000000-0000-1000-8000-000000000001",
      summary: "Strong progress",
      findings: [{ severity: "info", message: "The project is on track" }],
    });

    expect(plan.period).toBe("daily");
    expect(review.findings[0].severity).toBe("info");
  });
});
