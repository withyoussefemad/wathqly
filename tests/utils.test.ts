import { describe, it, expect } from "vitest";
import { cn, getInitials, formatDate } from "@/lib/utils";

describe("Utility Functions", () => {
  it("cn merges class names properly", () => {
    expect(cn("px-2 py-1", "bg-primary")).toContain("bg-primary");
    expect(cn("px-2", "px-4")).toBe("px-4"); // twMerge resolves conflicts
  });

  it("getInitials returns uppercase initials", () => {
    expect(getInitials("Youssef Emad")).toBe("YE");
    expect(getInitials("Wathqly")).toBe("WA");
    expect(getInitials(null)).toBe("W");
  });

  it("formatDate returns formatted date strings", () => {
    const formatted = formatDate("2026-10-05T12:00:00Z");
    expect(formatted).toContain("2026");
    expect(formatDate(null)).toBe("");
  });
});
