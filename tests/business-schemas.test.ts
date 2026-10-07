import { describe, expect, it } from "vitest";
import {
  createCompanySchema,
  createContactSchema,
  createDealSchema,
  createMeetingSchema,
  createContentItemSchema,
  createCampaignSchema,
  createActivitySchema,
} from "@/schemas/business";

describe("Phase 3 business schemas", () => {
  it("validates CRM entities and keeps workspace ownership explicit", () => {
    const company = createCompanySchema.parse({
      workspaceId: "00000000-0000-1000-8000-000000000001",
      name: "CertiLayer",
      domain: "certilayer.example",
      industry: "AI",
      size: "11-50",
      status: "customer",
    });
    expect(company.name).toBe("CertiLayer");

    const contact = createContactSchema.parse({
      workspaceId: company.workspaceId,
      firstName: "Youssef",
      lastName: "Emad",
      email: "youssef@example.com",
      companyId: "00000000-0000-1000-8000-000000000002",
    });
    expect(contact.email).toBe("youssef@example.com");

    const deal = createDealSchema.parse({
      workspaceId: company.workspaceId,
      title: "Enterprise rollout",
      value: 25000,
      stage: "lead",
      priority: "high",
    });
    expect(deal.value).toBe(25000);
  });

  it("validates meeting workflows and content lifecycle data", () => {
    const meeting = createMeetingSchema.parse({
      workspaceId: "00000000-0000-1000-8000-000000000001",
      title: "Architecture sync",
      scheduledAt: "2026-10-10T10:00:00.000Z",
      durationMinutes: 30,
      participants: [{ name: "Youssef Emad", email: "youssef@example.com" }],
    });
    expect(meeting.participants).toHaveLength(1);

    const content = createContentItemSchema.parse({
      workspaceId: meeting.workspaceId,
      title: "Why unified workspaces",
      platform: "linkedin",
      stage: "draft",
      contentBody: "A useful draft",
    });
    expect(content.stage).toBe("draft");

    const campaign = createCampaignSchema.parse({
      workspaceId: meeting.workspaceId,
      name: "Q4 leadership",
      status: "active",
    });
    expect(campaign.status).toBe("active");

    const activity = createActivitySchema.parse({
      workspaceId: meeting.workspaceId,
      title: "Send proposal",
      type: "email",
      dueDate: "2026-10-12T09:00:00.000Z",
    });
    expect(activity.completed).toBe(false);
  });
});
