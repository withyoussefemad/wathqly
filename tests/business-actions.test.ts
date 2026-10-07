import { describe, expect, it } from "vitest";
import { createBusinessActionResult } from "@/actions/business";

describe("Phase 3 action helpers", () => {
  it("returns structured success and failure responses", () => {
    expect(createBusinessActionResult({ success: true, data: { id: "1" } })).toEqual({
      success: true,
      data: { id: "1" },
    });
    expect(createBusinessActionResult({ success: false, message: "Denied" })).toEqual({
      success: false,
      message: "Denied",
    });
  });
});
