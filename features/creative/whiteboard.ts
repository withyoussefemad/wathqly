export type CreativeBoardElementKind =
  | "text"
  | "sticky"
  | "rectangle"
  | "circle"
  | "diamond"
  | "line"
  | "arrow"
  | "connector"
  | "image"
  | "frame"
  | "group";

export type CreativeBoardConnectorType =
  | "straight"
  | "elbow"
  | "curved";

export type CreativeBoardElement = {
  id: string;

  type: CreativeBoardElementKind;

  // Position & dimensions
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;

  // Layering
  zIndex: number;

  // Content
  text?: string;
  title?: string;

  // Styling
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: "solid" | "dashed" | "dotted";
  opacity?: number;

  // Typography
  fontSize?: number;
  fontWeight?: number;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";

  // Shape
  borderRadius?: number;

  // Assets
  src?: string;
  alt?: string;

  // Relationships
  parentId?: string | null;

  // Extra element-specific data
  data?: Record<string, unknown>;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreativeBoardConnector = {
  id: string;

  sourceElementId: string;
  targetElementId: string;

  type: CreativeBoardConnectorType;

  // Optional labels
  label?: string;

  // Styling
  color: string;
  width: number;
  style: "solid" | "dashed" | "dotted";

  // Arrow configuration
  startArrow?: "none" | "arrow" | "circle";
  endArrow?: "none" | "arrow" | "circle";

  // Optional custom routing points
  points?: Array<{
    x: number;
    y: number;
  }>;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreativeBoardViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type CreativeBoardModel = {
  id: string;

  workspaceId: string;

  // Optional project relationship
  projectId?: string | null;

  name: string;
  description: string;

  // Canvas
  viewport: CreativeBoardViewport;

  // Board content
  elements: CreativeBoardElement[];
  connectors: CreativeBoardConnector[];

  // Board metadata
  backgroundColor: string;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // Selection / editor state
  selectedElementIds: string[];

  // Versioning
  version: number;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export const createEmptyBoard = (
  workspaceId: string,
  name: string,
  createdBy: string,
): CreativeBoardModel => {
  const now = new Date().toISOString();

  return {
    id: `board-${crypto.randomUUID()}`,

    workspaceId,

    projectId: null,

    name,
    description: "",

    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },

    elements: [],
    connectors: [],

    backgroundColor: "#FFFFFF",

    gridEnabled: true,
    snapToGrid: true,
    gridSize: 16,

    selectedElementIds: [],

    version: 1,

    createdBy,
    createdAt: now,
    updatedAt: now,
  };
};
