import type { CreativeBoardViewport } from "@/features/creative/whiteboard";

export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };
export type ConnectorRoute = "straight" | "elbow" | "curved";

export const clampViewport = (viewport: CreativeBoardViewport): CreativeBoardViewport => ({
  ...viewport,
  zoom: Math.min(2.5, Math.max(0.25, viewport.zoom)),
});

export const screenToWorld = (point: Point, viewport: CreativeBoardViewport): Point => ({
  x: (point.x - viewport.x) / viewport.zoom,
  y: (point.y - viewport.y) / viewport.zoom,
});

export const worldToScreen = (point: Point, viewport: CreativeBoardViewport): Point => ({
  x: point.x * viewport.zoom + viewport.x,
  y: point.y * viewport.zoom + viewport.y,
});

export const snapValue = (value: number, gridSize: number): number => {
  const size = Math.max(1, gridSize);
  return Math.round(value / size) * size;
};

export const getConnectorPath = (
  source: Rect,
  target: Rect,
  route: ConnectorRoute,
  points: Point[] = [],
): string => {
  const start = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const end = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  if (route === "straight") return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  if (route === "elbow") return `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`;
  const control = points[0] ?? { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  return `M ${start.x} ${start.y} C ${control.x} ${start.y}, ${control.x} ${end.y}, ${end.x} ${end.y}`;
};
