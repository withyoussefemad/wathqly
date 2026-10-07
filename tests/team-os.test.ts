import { describe, expect, it } from "vitest";
import {
  addWorkspaceMemberSchema,
  approvalDecisionSchema,
  approvalRequestSchema,
  createTeamSchema,
  projectCommentSchema,
} from "@/schemas/team-os";

const projectId = "00000000-0000-4000-8000-000000000001";

describe("Team OS input validation", () => {
  it("only allows non-owner roles for member additions", () => {
    expect(addWorkspaceMemberSchema.safeParse({ email: "member@example.com", role: "member" }).success).toBe(true);
    expect(addWorkspaceMemberSchema.safeParse({ email: "member@example.com", role: "owner" }).success).toBe(false);
    expect(addWorkspaceMemberSchema.safeParse({ email: "not-an-email", role: "viewer" }).success).toBe(false);
  });

  it("validates team names and descriptions", () => {
    expect(createTeamSchema.safeParse({ name: "Product", description: "Build and ship" }).success).toBe(true);
    expect(createTeamSchema.safeParse({ name: "x" }).success).toBe(false);
    expect(createTeamSchema.safeParse({ name: "A".repeat(81) }).success).toBe(false);
  });

  it("bounds shared project comments and approval requests", () => {
    expect(projectCommentSchema.safeParse({ projectId, body: "Decision recorded" }).success).toBe(true);
    expect(projectCommentSchema.safeParse({ projectId, body: "  " }).success).toBe(false);
    expect(approvalRequestSchema.safeParse({ title: "Approve launch", projectId, description: "Ready to ship" }).success).toBe(true);
  });

  it("only accepts final approval outcomes", () => {
    expect(approvalDecisionSchema.safeParse({ id: projectId, decision: "approved" }).success).toBe(true);
    expect(approvalDecisionSchema.safeParse({ id: projectId, decision: "pending" }).success).toBe(false);
  });
});
