import { describe, expect, it } from "vitest";
import { normalizeSidebarPreferences } from "@/lib/utils/sidebar-preferences";

describe("normalizeSidebarPreferences", () => {
  it("uses a safe default when Supabase returns no preference data", () => {
    expect(normalizeSidebarPreferences(null)).toEqual({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
    });
  });

  it("accepts only boolean sidebar state", () => {
    expect(normalizeSidebarPreferences({ sidebarCollapsed: "yes", mobileSidebarOpen: true })).toEqual({
      sidebarCollapsed: false,
      mobileSidebarOpen: true,
    });
  });
});
