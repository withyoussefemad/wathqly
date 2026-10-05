import { describe, it, expect } from "vitest";
import {
  hasMinimumRole,
  canManageWorkspace,
  canDeleteWorkspace,
  canWriteData,
  canReadData,
} from "@/lib/permissions/workspace";

describe("Workspace Permissions & Role Hierarchy", () => {
  it("enforces role hierarchy accurately", () => {
    expect(hasMinimumRole("owner", "admin")).toBe(true);
    expect(hasMinimumRole("admin", "member")).toBe(true);
    expect(hasMinimumRole("member", "admin")).toBe(false);
    expect(hasMinimumRole("viewer", "member")).toBe(false);
  });

  it("permits only owner and admin to manage workspace", () => {
    expect(canManageWorkspace("owner")).toBe(true);
    expect(canManageWorkspace("admin")).toBe(true);
    expect(canManageWorkspace("member")).toBe(false);
    expect(canManageWorkspace("viewer")).toBe(false);
  });

  it("permits only owner to delete workspace", () => {
    expect(canDeleteWorkspace("owner")).toBe(true);
    expect(canDeleteWorkspace("admin")).toBe(false);
    expect(canDeleteWorkspace("member")).toBe(false);
  });

  it("permits members and above to write data", () => {
    expect(canWriteData("owner")).toBe(true);
    expect(canWriteData("admin")).toBe(true);
    expect(canWriteData("member")).toBe(true);
    expect(canWriteData("viewer")).toBe(false);
  });

  it("permits all assigned roles to read workspace data", () => {
    expect(canReadData("viewer")).toBe(true);
    expect(canReadData("member")).toBe(true);
    expect(canReadData("admin")).toBe(true);
    expect(canReadData("owner")).toBe(true);
  });
});
