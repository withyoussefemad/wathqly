import { describe, expect, it } from "vitest";
import { getNextAutomationRun, matchesAutomationConditions } from "@/features/automation/engine";
import { automationRuleSchema } from "@/schemas/automation";

const event = { priority: "high", title: "Review launch plan", status: "todo" };

describe("automation engine", () => {
  it("matches all configured conditions against an event", () => {
    expect(matchesAutomationConditions([
      { field: "priority", operator: "equals", value: "HIGH" },
      { field: "title", operator: "contains", value: "launch" },
    ], event)).toBe(true);
    expect(matchesAutomationConditions([{ field: "status", operator: "not_equals", value: "done" }], event)).toBe(true);
    expect(matchesAutomationConditions([{ field: "stage", operator: "equals", value: "won" }], event)).toBe(false);
  });

  it("requires schedules to have an interval and first run time", () => {
    expect(automationRuleSchema.safeParse({
      name: "Morning review",
      trigger_type: "schedule",
      actions: [{ type: "notify", title: "Review", message: "Start the day" }],
    }).success).toBe(false);
    expect(automationRuleSchema.safeParse({
      name: "Morning review",
      trigger_type: "schedule",
      repeat_interval: "daily",
      next_run_at: "2026-10-07T08:00:00.000Z",
      actions: [{ type: "notify", title: "Review", message: "Start the day" }],
    }).success).toBe(true);
  });

  it("advances recurring schedules in UTC and completes one-time schedules", () => {
    const monthEnd = new Date("2026-01-31T08:00:00.000Z");
    expect(getNextAutomationRun(monthEnd, "monthly")?.toISOString()).toBe("2026-02-28T08:00:00.000Z");
    expect(getNextAutomationRun(monthEnd, "weekly")?.toISOString()).toBe("2026-02-07T08:00:00.000Z");
    expect(getNextAutomationRun(monthEnd, "once")).toBeNull();
  });
});
