import { describe, expect, it } from "vitest";
import { catalogSchema, extensionSchema, type Extension } from "@/lib/types";

const verifiedEntry: Extension = {
  slug: "example-plugin",
  name: "example-plugin",
  kind: "plugin",
  categories: ["workflow"],
  summary: "A short summary of the plugin.",
  description: ["First paragraph."],
  publisher: { name: "Example Publisher", url: "https://github.com/example", kind: "community" },
  repositoryUrl: "https://github.com/example/example-plugin",
  license: "MIT",
  installCommands: ["/plugin install example-plugin@example-marketplace"],
  hooks: [],
  tags: ["example"],
  links: [{ label: "README", url: "https://github.com/example/example-plugin" }],
  stars: { count: 10, capturedAt: "2026-09-20" },
  isFeatured: false,
  verification: {
    status: "verified",
    checkedAt: "2026-09-20",
    sourceUrl: "https://github.com/example/example-plugin",
  },
};

const conceptEntry: Extension = {
  ...verifiedEntry,
  slug: "example-concept",
  name: "Example concept",
  kind: "mod",
  publisher: { name: "Marketplace spec", url: null, kind: "spec" },
  repositoryUrl: null,
  license: null,
  installCommands: [],
  links: [],
  stars: null,
  verification: { status: "concept", specReference: "Report 03, section 2.1" },
};

function withOverrides(base: Extension, overrides: Record<string, unknown>): unknown {
  return { ...base, ...overrides };
}

describe("extensionSchema", () => {
  it("accepts a valid verified entry", () => {
    expect(extensionSchema.safeParse(verifiedEntry).success).toBe(true);
  });

  it("accepts a valid concept entry", () => {
    expect(extensionSchema.safeParse(conceptEntry).success).toBe(true);
  });

  it("rejects a concept that has a repositoryUrl", () => {
    const result = extensionSchema.safeParse(
      withOverrides(conceptEntry, { repositoryUrl: "https://github.com/example/nope" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a concept that has stars", () => {
    const result = extensionSchema.safeParse(
      withOverrides(conceptEntry, { stars: { count: 1, capturedAt: "2026-09-20" } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a concept that has install commands", () => {
    const result = extensionSchema.safeParse(withOverrides(conceptEntry, { installCommands: ["claude --mod x"] }));
    expect(result.success).toBe(false);
  });

  it("rejects a verified entry without a repositoryUrl", () => {
    const result = extensionSchema.safeParse(withOverrides(verifiedEntry, { repositoryUrl: null }));
    expect(result.success).toBe(false);
  });

  it.each(["Bad Slug", "UPPER", "trailing-", "-leading", "double--dash", ""])("rejects slug %j", (slug) => {
    expect(extensionSchema.safeParse(withOverrides(verifiedEntry, { slug })).success).toBe(false);
  });

  it("rejects a summary longer than 160 characters", () => {
    const result = extensionSchema.safeParse(withOverrides(verifiedEntry, { summary: "x".repeat(161) }));
    expect(result.success).toBe(false);
  });

  it("accepts a summary of exactly 160 characters", () => {
    const result = extensionSchema.safeParse(withOverrides(verifiedEntry, { summary: "x".repeat(160) }));
    expect(result.success).toBe(true);
  });

  it.each([
    ["unlisted host", "https://example.com/example-plugin"],
    ["credentials in the URL", "https://user:pass@github.com/example/example-plugin"],
    ["userinfo phishing form", "https://github.com@evil.example/example-plugin"],
  ])("rejects a repository URL with %s", (_label, repositoryUrl) => {
    expect(extensionSchema.safeParse(withOverrides(verifiedEntry, { repositoryUrl })).success).toBe(false);
  });

  it("rejects a link URL on an unlisted host", () => {
    const result = extensionSchema.safeParse(
      withOverrides(verifiedEntry, { links: [{ label: "Docs", url: "https://example.com/docs" }] }),
    );
    expect(result.success).toBe(false);
  });

  describe("honesty rules enforced by the schema", () => {
    it("rejects a verified entry with kind mod", () => {
      expect(extensionSchema.safeParse(withOverrides(verifiedEntry, { kind: "mod" })).success).toBe(false);
    });

    it("rejects a concept that is not kind mod", () => {
      expect(extensionSchema.safeParse(withOverrides(conceptEntry, { kind: "plugin" })).success).toBe(false);
    });

    it("rejects a featured concept", () => {
      expect(extensionSchema.safeParse(withOverrides(conceptEntry, { isFeatured: true })).success).toBe(false);
    });

    it("rejects a concept that carries links", () => {
      const result = extensionSchema.safeParse(
        withOverrides(conceptEntry, { links: [{ label: "Repo", url: "https://github.com/example/nope" }] }),
      );
      expect(result.success).toBe(false);
    });
  });

  it("rejects non-https repository URLs", () => {
    const result = extensionSchema.safeParse(
      withOverrides(verifiedEntry, { repositoryUrl: "http://github.com/example/example-plugin" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a non-https verification sourceUrl", () => {
    const result = extensionSchema.safeParse(
      withOverrides(verifiedEntry, {
        verification: { status: "verified", checkedAt: "2026-09-20", sourceUrl: "http://example.com" },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a non-https link URL", () => {
    const result = extensionSchema.safeParse(
      withOverrides(verifiedEntry, { links: [{ label: "Bad", url: "ftp://example.com/file" }] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an entry with no categories", () => {
    expect(extensionSchema.safeParse(withOverrides(verifiedEntry, { categories: [] })).success).toBe(false);
  });

  it("rejects a malformed checkedAt date", () => {
    const result = extensionSchema.safeParse(
      withOverrides(verifiedEntry, {
        verification: { status: "verified", checkedAt: "20 Sep 2026", sourceUrl: "https://github.com/example" },
      }),
    );
    expect(result.success).toBe(false);
  });
});

describe("catalogSchema", () => {
  it("accepts a catalog with unique slugs", () => {
    const result = catalogSchema.safeParse({
      version: 1,
      generatedAt: "2026-09-20",
      extensions: [verifiedEntry, conceptEntry],
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate slugs", () => {
    const result = catalogSchema.safeParse({
      version: 1,
      generatedAt: "2026-09-20",
      extensions: [verifiedEntry, { ...conceptEntry, slug: verifiedEntry.slug }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown catalog version", () => {
    const result = catalogSchema.safeParse({ version: 2, generatedAt: "2026-09-20", extensions: [] });
    expect(result.success).toBe(false);
  });
});
