import { describe, it, expect } from "vitest";
import {
  createFolderSchema,
  createTagSchema,
  createNoteSchema,
  createFileSchema,
  createBookmarkSchema,
  knowledgeSearchSchema,
} from "@/schemas/knowledge";

describe("Phase 2 Knowledge Validation Schemas", () => {
  it("validates folder creation schema", () => {
    const valid = createFolderSchema.safeParse({
      name: "Engineering RFCs",
      type: "notes",
      color: "#7C3AED",
    });
    expect(valid.success).toBe(true);

    const invalid = createFolderSchema.safeParse({
      name: "",
      color: "not-a-hex",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates tag creation schema", () => {
    const valid = createTagSchema.safeParse({
      name: "Architecture",
      color: "#6366F1",
    });
    expect(valid.success).toBe(true);

    const invalid = createTagSchema.safeParse({
      name: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates note creation schema", () => {
    const valid = createNoteSchema.safeParse({
      title: "Modular Monolith Knowledge Architecture",
      content_html: "<p>Architecture decisions...</p>",
      plain_text: "Architecture decisions...",
      is_pinned: true,
      tags: ["tech", "architecture"],
    });
    expect(valid.success).toBe(true);

    const invalid = createNoteSchema.safeParse({
      title: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates file attachment schema", () => {
    const valid = createFileSchema.safeParse({
      name: "certilayer-architecture-v1.pdf",
      file_path: "/uploads/certilayer-architecture-v1.pdf",
      file_url: "https://storage.wathqly.app/uploads/certilayer-architecture-v1.pdf",
      file_type: "application/pdf",
      file_size: 1048576,
      category: "pdf",
    });
    expect(valid.success).toBe(true);

    const invalid = createFileSchema.safeParse({
      name: "test.pdf",
      file_path: "",
      file_url: "",
      file_size: -10,
    });
    expect(invalid.success).toBe(false);
  });

  it("validates bookmark schema", () => {
    const valid = createBookmarkSchema.safeParse({
      url: "https://certilayer.com/research/autonomous-agents",
      title: "Autonomous Agents in Financial Compliance",
      domain: "certilayer.com",
      tags: ["compliance", "ai"],
      is_favorite: true,
    });
    expect(valid.success).toBe(true);

    const invalid = createBookmarkSchema.safeParse({
      url: "invalid-url",
      title: "",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates knowledge search schema", () => {
    const valid = knowledgeSearchSchema.safeParse({
      query: "Tiptap backlinks",
      type: "notes",
    });
    expect(valid.success).toBe(true);
  });
});
