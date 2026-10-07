import { describe, expect, it } from "vitest";
import {
  clampViewport,
  getConnectorPath,
  screenToWorld,
  snapValue,
  worldToScreen,
} from "@/features/creative/whiteboard-engine";

describe("native whiteboard engine", () => {
  it("converts between screen and world coordinates using the viewport", () => {
    const viewport = { x: 120, y: 80, zoom: 2 };
    const world = screenToWorld({ x: 520, y: 280 }, viewport);
    expect(world).toEqual({ x: 200, y: 100 });
    expect(worldToScreen(world, viewport)).toEqual({ x: 520, y: 280 });
  });

  it("clamps zoom to the supported range", () => {
    expect(clampViewport({ x: 0, y: 0, zoom: 0.05 })).toEqual({ x: 0, y: 0, zoom: 0.25 });
    expect(clampViewport({ x: 0, y: 0, zoom: 4 })).toEqual({ x: 0, y: 0, zoom: 2.5 });
  });

  it("snaps values to the configured grid", () => {
    expect(snapValue(27, 16)).toBe(32);
    expect(snapValue(29, 16)).toBe(32);
  });

  it("routes connectors through the requested control points", () => {
    const path = getConnectorPath(
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 150, y: 100, width: 100, height: 50 },
      "curved",
      [{ x: 100, y: 25 }],
    );
    expect(path).toContain("M 50 25");
    expect(path).toContain("C 100 25");
  });
});
