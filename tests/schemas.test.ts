import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/schemas/auth";
import { createWorkspaceSchema } from "@/schemas/workspace";

describe("Validation Schemas (Zod)", () => {
  it("validates login credentials correctly", () => {
    const valid = loginSchema.safeParse({ email: "user@example.com", password: "password123" });
    expect(valid.success).toBe(true);

    const invalidEmail = loginSchema.safeParse({ email: "invalid-email", password: "password123" });
    expect(invalidEmail.success).toBe(false);

    const shortPassword = loginSchema.safeParse({ email: "user@example.com", password: "123" });
    expect(shortPassword.success).toBe(false);
  });

  it("validates registration with password confirmation match", () => {
    const valid = registerSchema.safeParse({
      fullName: "Youssef Emad",
      email: "youssef@example.com",
      password: "strongpassword123",
      confirmPassword: "strongpassword123",
    });
    expect(valid.success).toBe(true);

    const mismatch = registerSchema.safeParse({
      fullName: "Youssef Emad",
      email: "youssef@example.com",
      password: "strongpassword123",
      confirmPassword: "differentpassword",
    });
    expect(mismatch.success).toBe(false);
  });

  it("validates workspace creation names and slugs", () => {
    const valid = createWorkspaceSchema.safeParse({
      name: "Acme Corp",
      slug: "acme-corp",
    });
    expect(valid.success).toBe(true);

    const invalidSlug = createWorkspaceSchema.safeParse({
      name: "Acme Corp",
      slug: "Invalid Slug with spaces!",
    });
    expect(invalidSlug.success).toBe(false);
  });
});
