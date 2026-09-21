import { describe, expect, it } from "vitest";
import {
  AVAILABILITIES,
  catalogSchema,
  detailSchema,
  guideSectionSchema,
  extensionSchema,
  ideaSchema,
  ideasFileSchema,
  type Extension,
  type Idea,
} from "@/lib/types";

const installableEntry: Extension = {
  slug: "example-plugin",
  name: "example-plugin",
  kind: "plugin",
  categories: ["workflow"],
  summary: "A short summary of the plugin.",
  description: ["First paragraph."],
  publisher: { name: "Example Publisher", url: "https://github.com/example", kind: "community" },
  repositoryUrl: "https://github.com/example/example-plugin",
  license: "MIT",
  availability: "installable",
  installCommands: ["/plugin install example-plugin@example-marketplace"],
  notice: null,
  details: [],
  guide: [],
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

const builtInMod: Extension = {
  ...installableEntry,
  slug: "example-mod",
  name: "example-mod",
  kind: "mod",
  publisher: { name: "Anthropic", url: "https://github.com/anthropics", kind: "anthropic" },
  availability: "built-in",
  installCommands: [],
  notice: "Early access. The API may change without notice.",
  details: [
    { label: "Seated", value: "Built in", isCommand: false },
    { label: "Run from source", value: "claude --plugin-dir mods/example-mod", isCommand: true },
  ],
  guide: [
    { title: "What it does", paragraphs: ["It does one thing."], commands: [] },
    { title: "Set up", paragraphs: ["Run it from source."], commands: ["claude --plugin-dir mods/example-mod"] },
    { title: "Download the source", paragraphs: ["Clone the repository."], commands: ["git clone https://github.com/example/repo.git"] },
  ],
  hooks: ["session.start"],
  stars: null,
};

const sourceOnlyEntry: Extension = { ...installableEntry, slug: "example-source", availability: "source-only", installCommands: [] };

const idea: Idea = {
  slug: "example-idea",
  name: "Example idea",
  summary: "Would do one thing.",
  description: ["A proposal."],
  proposedEvents: ["command:pre_exec"],
  specReference: "Report 03, section 2.1",
};

/** Copy of `base` without the named keys, for testing that a field is required. */
function withoutKeys<T extends object>(base: T, keys: readonly string[]): unknown {
  return Object.fromEntries(Object.entries(base).filter(([key]) => !keys.includes(key)));
}

function withOverrides<T extends object>(base: T, overrides: Record<string, unknown>): unknown {
  return { ...base, ...overrides };
}

describe("extensionSchema", () => {
  it.each([
    ["installable", installableEntry],
    ["built-in mod", builtInMod],
    ["source-only", sourceOnlyEntry],
  ])("accepts a valid %s entry", (_label, entry) => {
    expect(extensionSchema.safeParse(entry).success).toBe(true);
  });

  it("knows exactly three availabilities", () => {
    expect([...AVAILABILITIES]).toEqual(["installable", "built-in", "source-only"]);
  });

  describe("availability rules", () => {
    it("rejects an installable entry without install commands", () => {
      const result = extensionSchema.safeParse(withOverrides(installableEntry, { installCommands: [] }));
      expect(result.success).toBe(false);
    });

    it("rejects a built-in entry that has install commands", () => {
      const result = extensionSchema.safeParse(withOverrides(builtInMod, { installCommands: ["claude mod add x"] }));
      expect(result.success).toBe(false);
    });

    it("rejects a source-only entry that has install commands", () => {
      const result = extensionSchema.safeParse(withOverrides(sourceOnlyEntry, { installCommands: ["/plugin install x@y"] }));
      expect(result.success).toBe(false);
    });

    it("rejects an unknown availability", () => {
      expect(extensionSchema.safeParse(withOverrides(installableEntry, { availability: "coming-soon" })).success).toBe(
        false,
      );
    });
  });

  describe("guide rules", () => {
    it("rejects a mod with no guide", () => {
      expect(extensionSchema.safeParse(withOverrides(builtInMod, { guide: [] })).success).toBe(false);
    });

    it("rejects a mod whose guide field is missing", () => {
      expect(extensionSchema.safeParse(withoutKeys(builtInMod, ["guide"])).success).toBe(false);
    });

    it("does not require a guide for other kinds and defaults it to empty", () => {
      const result = extensionSchema.safeParse(withoutKeys(installableEntry, ["guide"]));
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.guide).toEqual([]);
    });

    it("accepts a guide section without commands and defaults them to empty", () => {
      const result = guideSectionSchema.safeParse({ title: "What it does", paragraphs: ["Text."] });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.commands).toEqual([]);
    });

    it("rejects a guide section with an empty title, no paragraphs or an empty command", () => {
      expect(guideSectionSchema.safeParse({ title: "", paragraphs: ["Text."] }).success).toBe(false);
      expect(guideSectionSchema.safeParse({ title: "Set up", paragraphs: [] }).success).toBe(false);
      expect(guideSectionSchema.safeParse({ title: "Set up", paragraphs: ["Text."], commands: [""] }).success).toBe(false);
    });
  });

  describe("built-in rule", () => {
    it("allows built-in for an Anthropic publisher only", () => {
      expect(extensionSchema.safeParse(builtInMod).success).toBe(true);
      const communityPublisher = { name: "Someone", url: null, kind: "community" };
      expect(extensionSchema.safeParse(withOverrides(builtInMod, { publisher: communityPublisher })).success).toBe(false);
      const projectPublisher = { name: "Project", url: null, kind: "mcp-project" };
      expect(extensionSchema.safeParse(withOverrides(builtInMod, { publisher: projectPublisher })).success).toBe(false);
    });
  });

  describe("mod guide section titles", () => {
    const withTitles = (titles: readonly string[]): unknown =>
      withOverrides(builtInMod, { guide: titles.map((title) => ({ title, paragraphs: ["Text."], commands: [] })) });

    it.each([["Set up", "Download the source"], ["Setup", "Download"], ["SET UP", "DOWNLOAD"]])(
      "accepts %s and %s",
      (setup, download) => {
        expect(extensionSchema.safeParse(withTitles(["Overview", setup, download])).success).toBe(true);
      },
    );

    it("rejects a mod guide without a setup section or without a download section", () => {
      expect(extensionSchema.safeParse(withTitles(["Overview", "Download"])).success).toBe(false);
      expect(extensionSchema.safeParse(withTitles(["Overview", "Set up"])).success).toBe(false);
      expect(extensionSchema.safeParse(withTitles(["Overview"])).success).toBe(false);
    });
  });

  describe("mod rules", () => {
    it("rejects a mod that lists no hook events", () => {
      expect(extensionSchema.safeParse(withOverrides(builtInMod, { hooks: [] })).success).toBe(false);
    });

    it("does not require hooks for other kinds", () => {
      expect(extensionSchema.safeParse(withOverrides(installableEntry, { hooks: [] })).success).toBe(true);
    });
  });

  describe("verification and publisher", () => {
    it("rejects a concept verification, which only ideas use now", () => {
      const result = extensionSchema.safeParse(
        withOverrides(installableEntry, { verification: { status: "concept", specReference: "Report 03" } }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects the retired spec publisher kind", () => {
      const result = extensionSchema.safeParse(
        withOverrides(installableEntry, { publisher: { name: "Spec", url: null, kind: "spec" } }),
      );
      expect(result.success).toBe(false);
    });

    it("always requires a repositoryUrl", () => {
      expect(extensionSchema.safeParse(withOverrides(installableEntry, { repositoryUrl: null })).success).toBe(false);
    });

    it("rejects a malformed checkedAt date", () => {
      const result = extensionSchema.safeParse(
        withOverrides(installableEntry, {
          verification: { status: "verified", checkedAt: "20 Sep 2026", sourceUrl: "https://github.com/example" },
        }),
      );
      expect(result.success).toBe(false);
    });

    it("rejects a non-https verification sourceUrl", () => {
      const result = extensionSchema.safeParse(
        withOverrides(installableEntry, {
          verification: { status: "verified", checkedAt: "2026-09-20", sourceUrl: "http://example.com" },
        }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe("notice and details", () => {
    it("accepts a null notice and rejects an empty one", () => {
      expect(extensionSchema.safeParse(withOverrides(installableEntry, { notice: null })).success).toBe(true);
      expect(extensionSchema.safeParse(withOverrides(installableEntry, { notice: "" })).success).toBe(false);
    });

    it("requires every detail to have a label, a value and an isCommand flag", () => {
      expect(detailSchema.safeParse({ label: "Version", value: "0.1.0", isCommand: false }).success).toBe(true);
      expect(detailSchema.safeParse({ label: "", value: "0.1.0", isCommand: false }).success).toBe(false);
      expect(detailSchema.safeParse({ label: "Version", value: "", isCommand: false }).success).toBe(false);
      expect(detailSchema.safeParse({ label: "Version", value: "0.1.0" }).success).toBe(false);
    });

    it("rejects an entry that omits the new fields", () => {
      const legacy = withoutKeys(installableEntry, ["availability", "notice", "details"]);
      expect(extensionSchema.safeParse(legacy).success).toBe(false);
    });
  });

  it.each(["Bad Slug", "UPPER", "trailing-", "-leading", "double--dash", ""])("rejects slug %j", (slug) => {
    expect(extensionSchema.safeParse(withOverrides(installableEntry, { slug })).success).toBe(false);
  });

  it("rejects a summary longer than 160 characters and accepts exactly 160", () => {
    expect(extensionSchema.safeParse(withOverrides(installableEntry, { summary: "x".repeat(161) })).success).toBe(false);
    expect(extensionSchema.safeParse(withOverrides(installableEntry, { summary: "x".repeat(160) })).success).toBe(true);
  });

  it.each([
    ["unlisted host", "https://example.com/example-plugin"],
    ["raw content host", "https://raw.githubusercontent.com/example/example-plugin/main/README.md"],
    ["credentials in the URL", "https://user:pass@github.com/example/example-plugin"],
    ["userinfo phishing form", "https://github.com@evil.example/example-plugin"],
    ["plain http", "http://github.com/example/example-plugin"],
  ])("rejects a repository URL with %s", (_label, repositoryUrl) => {
    expect(extensionSchema.safeParse(withOverrides(installableEntry, { repositoryUrl })).success).toBe(false);
  });

  it.each([
    ["unlisted host", "https://example.com/docs"],
    ["non-https scheme", "ftp://example.com/file"],
  ])("rejects a link URL with %s", (_label, url) => {
    const result = extensionSchema.safeParse(withOverrides(installableEntry, { links: [{ label: "Docs", url }] }));
    expect(result.success).toBe(false);
  });

  it("rejects an entry with no categories", () => {
    expect(extensionSchema.safeParse(withOverrides(installableEntry, { categories: [] })).success).toBe(false);
  });
});

describe("catalogSchema", () => {
  it("accepts a catalog with unique slugs", () => {
    const result = catalogSchema.safeParse({
      version: 1,
      generatedAt: "2026-09-20",
      extensions: [installableEntry, builtInMod, sourceOnlyEntry],
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate slugs", () => {
    const result = catalogSchema.safeParse({
      version: 1,
      generatedAt: "2026-09-20",
      extensions: [installableEntry, { ...builtInMod, slug: installableEntry.slug }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown catalog version", () => {
    expect(catalogSchema.safeParse({ version: 2, generatedAt: "2026-09-20", extensions: [] }).success).toBe(false);
  });
});

describe("ideaSchema", () => {
  it("accepts a valid idea", () => {
    expect(ideaSchema.safeParse(idea).success).toBe(true);
  });

  it("accepts an idea with no proposed events", () => {
    expect(ideaSchema.safeParse({ ...idea, proposedEvents: [] }).success).toBe(true);
  });

  it("rejects a bad slug, an over-long summary and a missing spec reference", () => {
    expect(ideaSchema.safeParse({ ...idea, slug: "Bad Slug" }).success).toBe(false);
    expect(ideaSchema.safeParse({ ...idea, summary: "x".repeat(161) }).success).toBe(false);
    expect(ideaSchema.safeParse({ ...idea, specReference: "" }).success).toBe(false);
  });

  it("rejects empty description and empty event names", () => {
    expect(ideaSchema.safeParse({ ...idea, description: [] }).success).toBe(false);
    expect(ideaSchema.safeParse({ ...idea, proposedEvents: [""] }).success).toBe(false);
  });
});

describe("ideasFileSchema", () => {
  it("accepts a file with unique idea slugs", () => {
    const file = { version: 1, checkedAt: "2026-09-20", ideas: [idea, { ...idea, slug: "another-idea" }] };
    expect(ideasFileSchema.safeParse(file).success).toBe(true);
  });

  it("rejects duplicate idea slugs", () => {
    const result = ideasFileSchema.safeParse({ version: 1, checkedAt: "2026-09-20", ideas: [idea, { ...idea, name: "Copy" }] });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown file version", () => {
    expect(ideasFileSchema.safeParse({ version: 2, checkedAt: "2026-09-20", ideas: [] }).success).toBe(false);
  });

  it("requires a valid checkedAt date", () => {
    expect(ideasFileSchema.safeParse({ version: 1, ideas: [idea] }).success).toBe(false);
    expect(ideasFileSchema.safeParse({ version: 1, checkedAt: "20 Sep 2026", ideas: [idea] }).success).toBe(false);
  });
});
