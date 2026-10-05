import { describe, it, expect } from "vitest";
import {
  createGoalSchema,
  createProjectSchema,
  createTaskSchema,
  createPlanSchema,
  createCalendarEventSchema,
} from "@/schemas/core-os";

describe("Phase 1 Core OS Validation Schemas", () => {
  it("validates goal creation schema", () => {
    const valid = createGoalSchema.safeParse({
      title: "Achieve Product Market Fit",
      timeframe: "quarter",
      priority: "high",
      targetValue: 100,
      currentValue: 25,
      unit: "%",
    });
    expect(valid.success).toBe(true);

    const invalid = createGoalSchema.safeParse({
      title: "A", // too short
      targetValue: 0,
    });
    expect(invalid.success).toBe(false);
  });

  it("validates project creation schema", () => {
    const valid = createProjectSchema.safeParse({
      name: "Core OS Engine",
      slug: "core-os-engine",
      priority: "urgent",
      color: "#7C3AED",
    });
    expect(valid.success).toBe(true);

    const missingName = createProjectSchema.safeParse({
      color: "#7C3AED",
    });
    expect(missingName.success).toBe(false);
  });

  it("validates task creation schema", () => {
    const valid = createTaskSchema.safeParse({
      title: "Implement database migrations for Phase 1",
      priority: "urgent",
      isMyDay: true,
      estimatedMinutes: 60,
    });
    expect(valid.success).toBe(true);

    const invalidTime = createTaskSchema.safeParse({
      title: "Test task",
      estimatedMinutes: 2000, // over 1440 limit
    });
    expect(invalidTime.success).toBe(false);
  });

  it("validates daily/weekly plan creation schema", () => {
    const valid = createPlanSchema.safeParse({
      type: "daily",
      targetDate: "2026-10-06",
      objective: "Deliver Phase 1 Core OS complete loop",
    });
    expect(valid.success).toBe(true);

    const missingObjective = createPlanSchema.safeParse({
      type: "daily",
      targetDate: "2026-10-06",
      objective: "",
    });
    expect(missingObjective.success).toBe(false);
  });

  it("validates calendar event schema", () => {
    const valid = createCalendarEventSchema.safeParse({
      title: "Sprint Review & Architecture Sync",
      startTime: "2026-10-06T10:00:00Z",
      endTime: "2026-10-06T11:00:00Z",
      allDay: false,
      eventType: "meeting",
    });
    expect(valid.success).toBe(true);

    const invalidType = createCalendarEventSchema.safeParse({
      title: "Invalid Event",
      startTime: "2026-10-06T10:00:00Z",
      endTime: "2026-10-06T11:00:00Z",
      eventType: "invalid_type",
    });
    expect(invalidType.success).toBe(false);
  });
});
