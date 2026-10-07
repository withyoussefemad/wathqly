import { describe, expect, it } from "vitest";
import {
  createBoardSchema,
  createNodeSchema,
  createConnectorSchema,
  createTemplateSchema,
} from "@/schemas/creative";

const workspaceId = "00000000-0000-1000-8000-000000000001";

describe("Phase 4 creative schemas", () => {
  it("validates a workspace-owned board", () => {
    const board = createBoardSchema.parse({
      workspaceId,
      name: "Product architecture",
      description: "Core platform flow",
    });
    expect(board.name).toBe("Product architecture");
    expect(board.workspaceId).toBe(workspaceId);
  });

  it("validates node coordinates and connector endpoints", () => {
    const node = createNodeSchema.parse({
      workspaceId,
      boardId: "00000000-0000-1000-8000-000000000002",
      name: "API gateway",
      x: 120,
      y: 80,
      width: 220,
      height: 96,
      color: "#7c3aed",
    });
    expect(node.x).toBe(120);

    const connector = createConnectorSchema.parse({
      workspaceId,
      boardId: node.boardId,
      sourceNodeId: node.id,
      targetNodeId: "00000000-0000-1000-8000-000000000003",
      color: "#7c3aed",
    });
    expect(connector.sourceNodeId).toBe(node.id);
  });

  it("validates reusable templates", () => {
    const template = createTemplateSchema.parse({
      workspaceId,
      name: "Architecture review",
      kind: "architecture",
      nodes: [],
      connectors: [],
    });
    expect(template.kind).toBe("architecture");
  });
});
