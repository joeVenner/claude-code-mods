// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { communityMod } from "@/lib/__fixtures__/community";
import {
  communityRuleProblems,
  countByKind,
  getAllExtensions,
  getCatalog,
  getCatalogGeneratedAt,
  getExtensionBySlug,
  getFeaturedExtensions,
  getRelatedExtensions,
  loadCatalog,
} from "@/lib/catalog";
import { getIdeas } from "@/lib/ideas";
import { EXTENSION_KINDS, catalogSchema, type Extension } from "@/lib/types";

const DASH_PATTERN = /[–—]/;
const CATALOG_URL_PREFIXES = ["https://github.com/", "https://code.claude.com/"] as const;
const TODAY = "2026-09-21";

function collectStrings(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") {
    found.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, found);
  } else if (value !== null && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, found);
  }
  return found;
}

/** Slugs listed in the maintainers' catalog.json, so the checks below never depend on community files. */
function readCuratedSlugs(): ReadonlySet<string> {
  const raw = JSON.parse(readFileSync(path.join(process.cwd(), "src", "data", "catalog.json"), "utf8")) as {
    extensions: readonly { slug: string }[];
  };
  return new Set(raw.extensions.map((entry) => entry.slug));
}

describe("the shipped data", () => {
  const all = getAllExtensions();
  const curatedSlugs = readCuratedSlugs();
  const curated = all.filter((entry) => curatedSlugs.has(entry.slug));
  const anthropicMods = curated.filter((entry) => entry.publisher.kind === "anthropic" && entry.kind === "mod");

  it("passes catalogSchema", () => {
    expect(catalogSchema.safeParse(getCatalog()).success).toBe(true);
  });

  it("has unique slugs", () => {
    expect(new Set(all.map((entry) => entry.slug)).size).toBe(all.length);
  });

  it("verifies every entry, and no curated entry is dated after the catalog", () => {
    for (const entry of all) {
      expect(entry.verification.status, entry.slug).toBe("verified");
    }
    for (const entry of curated) {
      expect(entry.verification.checkedAt <= getCatalogGeneratedAt(), entry.slug).toBe(true);
    }
  });

  it("points every curated entry at an allowed host", () => {
    for (const entry of curated) {
      const urls = [
        entry.repositoryUrl,
        entry.verification.sourceUrl,
        ...entry.links.map((link) => link.url),
        ...(entry.publisher.url === null ? [] : [entry.publisher.url]),
      ];
      for (const url of urls) {
        expect(
          CATALOG_URL_PREFIXES.some((prefix) => url.startsWith(prefix)),
          `${entry.slug}: ${url}`,
        ).toBe(true);
      }
    }
  });

  it("gives every installable entry commands and every other entry none", () => {
    for (const entry of all) {
      expect(entry.installCommands.length > 0, entry.slug).toBe(entry.availability === "installable");
    }
  });

  it("lists built-in only for Anthropic publishers, and makes every mod built in or source only", () => {
    for (const entry of all) {
      if (entry.availability === "built-in") expect(entry.publisher.kind, entry.slug).toBe("anthropic");
    }
    const mods = all.filter((entry) => entry.kind === "mod");
    expect(mods.length).toBeGreaterThan(0);
    for (const mod of mods) {
      expect(["built-in", "source-only"], mod.slug).toContain(mod.availability);
      expect(mod.hooks.length, mod.slug).toBeGreaterThan(0);
      expect(mod.repositoryUrl, mod.slug).toMatch(/^https:\/\/github\.com\//);
    }
  });

  describe("Anthropic mod guides", () => {
    it("exist, and give setup and download sections beside an overview", () => {
      expect(anthropicMods.length).toBeGreaterThan(0);
      for (const mod of anthropicMods) {
        const titles = mod.guide.map((section) => section.title.toLowerCase());
        expect(titles.some((title) => /set ?up/.test(title)), `${mod.slug} setup`).toBe(true);
        expect(titles.some((title) => title.includes("download")), `${mod.slug} download`).toBe(true);
        expect(mod.guide.length, mod.slug).toBeGreaterThanOrEqual(3);
      }
    });

    it("give the download section git commands that name the mod folder, and state the license", () => {
      for (const mod of anthropicMods) {
        const download = mod.guide.find((section) => section.title.toLowerCase().includes("download"));
        const commands = download?.commands ?? [];
        expect(commands.length, mod.slug).toBeGreaterThan(0);
        expect(commands.some((command) => command.startsWith("git clone ")), mod.slug).toBe(true);
        expect(commands.some((command) => command.includes(`mods/${mod.slug}`)), mod.slug).toBe(true);
        expect(download?.paragraphs.join(" "), mod.slug).toMatch(/All rights reserved/);
      }
    });

    it("never call the source open source or name a permissive license", () => {
      for (const mod of anthropicMods) {
        for (const section of mod.guide) {
          expect(section.paragraphs.join(" "), `${mod.slug}: ${section.title}`).not.toMatch(
            /\bis open source\b|\bopen-source\b|\bMIT\b|\bApache\b/i,
          );
        }
      }
    });

    it("keep every command on one line and never repeat the early access notice", () => {
      for (const mod of anthropicMods) {
        const guideText = mod.guide.flatMap((section) => section.paragraphs).join(" ");
        expect(mod.notice, mod.slug).not.toBeNull();
        expect(guideText, mod.slug).not.toContain(mod.notice ?? "");
        for (const section of mod.guide) {
          for (const command of section.commands) {
            expect(command, `${mod.slug}: ${section.title}`).not.toMatch(/[\n\r]/);
          }
        }
      }
    });
  });

  it("features exactly the Anthropic mods", () => {
    const featured = getFeaturedExtensions();
    expect(featured.map((entry) => entry.slug).sort()).toEqual(anthropicMods.map((entry) => entry.slug).sort());
    for (const entry of featured) {
      expect(entry.availability, entry.slug).toBe("built-in");
    }
    expect(all.filter((entry) => entry.kind === "mod" && entry.publisher.kind === "anthropic" && !entry.isFeatured)).toEqual([]);
  });

  it("never lists an idea in the directory", () => {
    const ideaSlugs = new Set(getIdeas().map((idea) => idea.slug));
    expect(ideaSlugs.size).toBeGreaterThan(0);
    for (const entry of all) {
      expect(ideaSlugs.has(entry.slug), entry.slug).toBe(false);
    }
  });

  it("never uses an em-dash or en-dash in a curated entry", () => {
    expect(collectStrings(curated).filter((text) => DASH_PATTERN.test(text))).toEqual([]);
  });

  it("dates every stars figure", () => {
    for (const entry of all) {
      if (entry.stars === null) continue;
      expect(entry.stars.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("uses dotted event names for Anthropic mods, never the spec's colon names", () => {
    for (const mod of anthropicMods) {
      for (const hook of mod.hooks) {
        expect(hook, `${mod.slug}: ${hook}`).toMatch(/^[a-z]+\.[a-z*]+$/);
      }
    }
  });

  it("makes every command detail a single line", () => {
    for (const entry of all) {
      for (const detail of entry.details.filter((candidate) => candidate.isCommand)) {
        expect(detail.value, `${entry.slug}: ${detail.label}`).not.toMatch(/[\n\r]/);
      }
    }
  });
});

describe("getCatalog", () => {
  it("returns the same validated object on repeated calls", () => {
    expect(getCatalog()).toBe(getCatalog());
    expect(getCatalog().version).toBe(1);
  });

  it("exposes the generation date as YYYY-MM-DD", () => {
    expect(getCatalogGeneratedAt()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getAllExtensions", () => {
  it("lists featured entries first, then sorts by name", () => {
    const all = getAllExtensions();
    const firstNonFeatured = all.findIndex((entry) => !entry.isFeatured);
    expect(firstNonFeatured).toBeGreaterThan(0);
    expect(all.slice(0, firstNonFeatured).every((entry) => entry.isFeatured)).toBe(true);
    expect(all.slice(firstNonFeatured).some((entry) => entry.isFeatured)).toBe(false);

    const isNameSorted = (entries: readonly Extension[]): boolean =>
      entries.every((entry, index) => index === 0 || entries[index - 1].name.localeCompare(entry.name) <= 0);
    expect(isNameSorted(all.slice(0, firstNonFeatured))).toBe(true);
    expect(isNameSorted(all.slice(firstNonFeatured))).toBe(true);
  });
});

describe("getExtensionBySlug", () => {
  it("returns the entry for a known slug", () => {
    expect(getExtensionBySlug("diff")?.kind).toBe("mod");
  });

  it("returns undefined for an unknown slug or an idea slug", () => {
    expect(getExtensionBySlug("does-not-exist")).toBeUndefined();
    expect(getExtensionBySlug(getIdeas()[0].slug)).toBeUndefined();
  });
});

describe("getRelatedExtensions", () => {
  it("excludes the entry itself and shares a category", () => {
    const source = getExtensionBySlug("diff");
    expect(source).toBeDefined();
    const related = getRelatedExtensions("diff");
    expect(related.length).toBeGreaterThan(0);
    for (const entry of related) {
      expect(entry.slug).not.toBe("diff");
      expect(entry.categories.some((category) => source?.categories.includes(category))).toBe(true);
    }
  });

  it("defaults to three results and respects an explicit limit", () => {
    expect(getRelatedExtensions("diff").length).toBeLessThanOrEqual(3);
    expect(getRelatedExtensions("diff", 1)).toHaveLength(1);
    expect(getRelatedExtensions("diff", 5).length).toBeLessThanOrEqual(5);
  });

  it("returns an empty list for an unknown slug or a non-positive limit", () => {
    expect(getRelatedExtensions("does-not-exist")).toEqual([]);
    expect(getRelatedExtensions("diff", 0)).toEqual([]);
  });
});

describe("counts", () => {
  it("countByKind covers every kind and sums to the total", () => {
    const counts = countByKind();
    expect(Object.keys(counts).sort()).toEqual([...EXTENSION_KINDS].sort());
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(getAllExtensions().length);
  });
});

const catalogEntry: Extension = {
  slug: "curated-plugin",
  name: "curated-plugin",
  kind: "plugin",
  categories: ["workflow"],
  summary: "A curated plugin.",
  description: ["Paragraph."],
  publisher: { name: "Publisher", url: "https://github.com/publisher", kind: "community" },
  repositoryUrl: "https://github.com/publisher/curated-plugin",
  license: "MIT",
  availability: "installable",
  installCommands: ["/plugin install curated-plugin@publisher"],
  notice: null,
  details: [],
  guide: [],
  hooks: [],
  tags: [],
  links: [],
  stars: null,
  isFeatured: false,
  verification: {
    status: "verified",
    checkedAt: "2026-09-20",
    sourceUrl: "https://github.com/publisher/curated-plugin",
  },
};

describe("loadCatalog with a data directory", () => {
  let dataDirectory: string;

  const communityFolder = (): string => path.join(dataDirectory, "community");
  const writeCatalog = (extensions: readonly unknown[]): void => {
    writeFileSync(
      path.join(dataDirectory, "catalog.json"),
      JSON.stringify({ version: 1, generatedAt: "2026-09-20", extensions }),
    );
  };
  const writeCommunityFile = (fileName: string, content: unknown): void => {
    mkdirSync(communityFolder(), { recursive: true });
    writeFileSync(path.join(communityFolder(), fileName), typeof content === "string" ? content : JSON.stringify(content));
  };
  const load = (): ReturnType<typeof loadCatalog> => loadCatalog(dataDirectory, TODAY);
  const loadMessage = (): string => {
    try {
      load();
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
    throw new Error("expected loadCatalog to throw");
  };

  beforeEach(() => {
    dataDirectory = mkdtempSync(path.join(tmpdir(), "catalog-loader-"));
    writeCatalog([catalogEntry]);
  });

  afterEach(() => {
    rmSync(dataDirectory, { recursive: true, force: true });
  });

  describe("valid data", () => {
    it("loads only catalog.json when the community folder is missing", () => {
      expect(load().extensions.map((entry) => entry.slug)).toEqual(["curated-plugin"]);
    });

    it("ignores a Finder .DS_Store so a maintainer opening the folder cannot break the build", () => {
      writeCommunityFile(".gitkeep", "");
      writeCommunityFile(".DS_Store", "binary junk");
      expect(() => load()).not.toThrow();
    });

    it("loads only catalog.json when the community folder holds only .gitkeep", () => {
      writeCommunityFile(".gitkeep", "");
      expect(load().extensions).toHaveLength(1);
    });

    it("loads a compliant community mod cleanly and leaves the curated entries as they were", () => {
      const before = load().extensions;
      writeCommunityFile("tidy-hooks.json", communityMod);
      const after = load().extensions;
      expect(after.map((entry) => entry.slug)).toEqual(["curated-plugin", "tidy-hooks"]);
      expect(after.slice(0, before.length)).toEqual(before);
      const community = after.find((entry) => entry.slug === "tidy-hooks");
      expect(community?.publisher.kind).toBe("community");
      expect(community?.isFeatured).toBe(false);
      expect(after.filter((entry) => entry.publisher.kind === "anthropic")).toEqual([]);
      expect(after.filter((entry) => entry.isFeatured)).toEqual([]);
    });

    it("accepts a community file dated today", () => {
      writeCommunityFile("tidy-hooks.json", {
        ...communityMod,
        verification: { ...communityMod.verification, checkedAt: TODAY },
      });
      expect(load().extensions).toHaveLength(2);
    });
  });

  describe("what may sit in the community folder", () => {
    it.each([
      ["a text file", "notes.txt"],
      ["an upper-case extension", "Foo.JSON"],
      ["a double extension", "tidy-hooks.json.txt"],
      ["a dotfile", ".env"],
      ["a file with no extension", "README"],
    ])("rejects %s", (_label, fileName) => {
      writeCommunityFile(fileName, "x");
      expect(loadMessage()).toContain(`${fileName}: not allowed in the community folder`);
    });

    it("rejects a subfolder", () => {
      mkdirSync(path.join(communityFolder(), "nested"), { recursive: true });
      expect(loadMessage()).toContain("nested: not allowed in the community folder");
    });

    it("rejects a symlink named like a data file", () => {
      writeCommunityFile("real.json", communityMod);
      symlinkSync(path.join(communityFolder(), "real.json"), path.join(communityFolder(), "tidy-hooks.json"));
      expect(loadMessage()).toContain("tidy-hooks.json: not allowed in the community folder");
    });

    it("rejects a community folder that is itself a symlink", () => {
      const elsewhere = mkdtempSync(path.join(tmpdir(), "catalog-elsewhere-"));
      try {
        symlinkSync(elsewhere, communityFolder());
        expect(loadMessage()).toContain("must be a regular folder");
      } finally {
        rmSync(elsewhere, { recursive: true, force: true });
      }
    });
  });

  describe("file and schema problems", () => {
    it("names the file and the zod issue path when a community file fails the schema", () => {
      writeCommunityFile("tidy-hooks.json", { ...communityMod, summary: "" });
      expect(loadMessage()).toMatch(/tidy-hooks\.json:[\s\S]*summary/);
    });

    it("names the file when a community file is malformed JSON", () => {
      writeCommunityFile("broken.json", "{ not json");
      expect(loadMessage()).toMatch(/broken\.json: not valid JSON/);
    });

    it("names catalog.json when it is malformed", () => {
      writeFileSync(path.join(dataDirectory, "catalog.json"), "[");
      expect(loadMessage()).toMatch(/catalog\.json: not valid JSON/);
    });

    it("names catalog.json and the issue path when a curated entry is invalid", () => {
      writeCatalog([{ ...catalogEntry, installCommands: [] }]);
      expect(loadMessage()).toMatch(/catalog\.json:[\s\S]*extensions\.0/);
    });

    it("still reports community problems when catalog.json is invalid", () => {
      writeFileSync(path.join(dataDirectory, "catalog.json"), "[");
      writeCommunityFile("tidy-hooks.json", { ...communityMod, isFeatured: true });
      const message = loadMessage();
      expect(message).toMatch(/catalog\.json: not valid JSON/);
      expect(message).toMatch(/tidy-hooks\.json[\s\S]*isFeatured must be false/);
    });

    it("reports every invalid file in one error", () => {
      writeCommunityFile("one.json", "{");
      writeCommunityFile("tidy-hooks.json", { ...communityMod, isFeatured: true });
      expect(loadMessage()).toMatch(/one\.json[\s\S]*tidy-hooks\.json/);
    });

    it("rejects a curated built-in entry from a non-Anthropic publisher", () => {
      writeCatalog([{ ...catalogEntry, availability: "built-in", installCommands: [] }]);
      expect(loadMessage()).toMatch(/catalog\.json:[\s\S]*only Anthropic publishers can list availability "built-in"/);
    });
  });

  describe("community rules", () => {
    it("rejects a file name that does not match the slug", () => {
      writeCommunityFile("other-name.json", communityMod);
      expect(loadMessage()).toMatch(/other-name\.json[\s\S]*file name must be "tidy-hooks\.json"/);
    });

    it("rejects a publisher kind other than community", () => {
      writeCommunityFile("tidy-hooks.json", {
        ...communityMod,
        publisher: { ...communityMod.publisher, kind: "anthropic" },
      });
      expect(loadMessage()).toMatch(/tidy-hooks\.json[\s\S]*publisher\.kind must be "community"/);
    });

    it("rejects a community file that features itself or claims stars", () => {
      writeCommunityFile("tidy-hooks.json", {
        ...communityMod,
        isFeatured: true,
        stars: { count: 5000, capturedAt: "2026-09-20" },
      });
      const message = loadMessage();
      expect(message).toMatch(/isFeatured must be false/);
      expect(message).toMatch(/stars must be null/);
    });

    it("rejects a community file that claims to be built in", () => {
      writeCommunityFile("tidy-hooks.json", { ...communityMod, availability: "built-in" });
      expect(loadMessage()).toMatch(/tidy-hooks\.json[\s\S]*built-in/);
    });

    it("rejects a community repository that is not on github.com", () => {
      writeCommunityFile("tidy-hooks.json", {
        ...communityMod,
        repositoryUrl: "https://code.claude.com/docs/en/plugins",
      });
      expect(loadMessage()).toMatch(/tidy-hooks\.json[\s\S]*repositoryUrl must be on github\.com/);
    });

    it("names both files when a community slug repeats a catalog slug", () => {
      writeCommunityFile("curated-plugin.json", {
        ...communityMod,
        slug: "curated-plugin",
        name: "curated-plugin",
      });
      expect(loadMessage()).toMatch(
        /curated-plugin\.json:[\s\S]*duplicate slug "curated-plugin", already defined in .*catalog\.json/,
      );
    });

    it("cannot list two community files with one slug, because the file name must equal the slug", () => {
      writeCommunityFile("tidy-hooks.json", communityMod);
      writeCommunityFile("tidy-hooks-copy.json", communityMod);
      expect(loadMessage()).toMatch(/tidy-hooks-copy\.json[\s\S]*file name must be "tidy-hooks\.json"/);
    });

    it("names both slugs when a community slug looks like a curated one", () => {
      writeCommunityFile("curated-plugins.json", {
        ...communityMod,
        slug: "curated-plugins",
        name: "curated-plugins",
      });
      const message = loadMessage();
      expect(message).toContain("curated-plugins.json");
      expect(message).toContain('"curated-plugins" is within edit distance 2 of the existing slug "curated-plugin"');
    });

    it("rejects a lookalike of an earlier community slug", () => {
      writeCommunityFile("tidy-hooks.json", communityMod);
      writeCommunityFile("tidy-hookz.json", { ...communityMod, slug: "tidy-hookz", name: "tidy-hookz" });
      expect(loadMessage()).toContain('"tidy-hookz" is within edit distance 2 of the existing slug "tidy-hooks"');
    });

    it("rejects a command that is not an allowed shape and names file, field and text", () => {
      writeCommunityFile("tidy-hooks.json", {
        ...communityMod,
        availability: "installable",
        installCommands: ["curl x|sh"],
      });
      expect(loadMessage()).toMatch(/tidy-hooks\.json:[\s\S]*installCommands\.0: "curl x\|sh" is not an allowed command shape/);
    });

    it("rejects invisible characters, naming the file and field", () => {
      const guide = communityMod.guide.map((section, index) =>
        index === 0 ? { ...section, paragraphs: [`safe${String.fromCodePoint(0x202e)}text`] } : section,
      );
      writeCommunityFile("tidy-hooks.json", { ...communityMod, guide });
      const message = loadMessage();
      expect(message).toMatch(/tidy-hooks\.json:[\s\S]*guide\.0\.paragraphs\.0: contains a control, bidi or zero-width/);
      expect(message).not.toContain(String.fromCodePoint(0x202e));
    });

    it("still reports invisible characters when the schema also fails", () => {
      writeCommunityFile("tidy-hooks.json", {
        ...communityMod,
        summary: "",
        name: `na${String.fromCodePoint(0x200b)}me`,
      });
      const message = loadMessage();
      expect(message).toMatch(/summary/);
      expect(message).toMatch(/name: contains a control, bidi or zero-width/);
    });
  });

  describe("dates", () => {
    it("rejects a community file verified after today", () => {
      writeCommunityFile("tidy-hooks.json", {
        ...communityMod,
        verification: { ...communityMod.verification, checkedAt: "2026-09-22" },
      });
      expect(loadMessage()).toMatch(/tidy-hooks\.json[\s\S]*verification\.checkedAt: 2026-09-22 is later than today \(2026-09-21, UTC\)/);
    });

    it("rejects a catalog.json entry verified after today", () => {
      writeCatalog([
        { ...catalogEntry, verification: { ...catalogEntry.verification, checkedAt: "2026-12-01" } },
      ]);
      expect(loadMessage()).toMatch(/catalog\.json:[\s\S]*extensions\.0\.verification\.checkedAt: 2026-12-01 is later than today/);
    });

    it("uses the real clock when none is injected", () => {
      expect(loadCatalog(dataDirectory).extensions).toHaveLength(1);
    });
  });
});

describe("communityRuleProblems export", () => {
  it("is reachable from the catalog module and accepts a compliant entry", () => {
    expect(communityRuleProblems(communityMod, "tidy-hooks.json")).toEqual([]);
  });
});
