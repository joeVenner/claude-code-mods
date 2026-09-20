import { describe, expect, it } from "vitest";
import rawCatalog from "@/data/catalog.json";
import {
  countByCategory,
  countByKind,
  getAllExtensions,
  getCatalog,
  getCatalogGeneratedAt,
  getExtensionBySlug,
  getFeaturedExtensions,
  getRelatedExtensions,
} from "@/lib/catalog";
import { EXTENSION_KINDS, catalogSchema, type Extension } from "@/lib/types";

const ALLOWED_SOURCE_PREFIXES = [
  "https://github.com/",
  "https://code.claude.com/",
  "https://docs.claude.com/",
  "https://modelcontextprotocol.io/",
] as const;

const DASH_PATTERN = /[–—]/;

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

function hasAllowedPrefix(url: string): boolean {
  return ALLOWED_SOURCE_PREFIXES.some((prefix) => url.startsWith(prefix));
}

describe("catalog.json", () => {
  const all = getAllExtensions();
  const verified = all.filter((entry) => entry.verification.status === "verified");
  const concepts = all.filter((entry) => entry.verification.status === "concept");

  it("passes catalogSchema", () => {
    expect(catalogSchema.safeParse(rawCatalog).success).toBe(true);
  });

  it("has unique slugs", () => {
    expect(new Set(all.map((entry) => entry.slug)).size).toBe(all.length);
  });

  it("has 24 to 32 real entries and exactly 8 concepts", () => {
    expect(verified.length).toBeGreaterThanOrEqual(24);
    expect(verified.length).toBeLessThanOrEqual(32);
    expect(concepts).toHaveLength(8);
  });

  it("covers every real kind and never lists a verified mod", () => {
    const realKinds = new Set(verified.map((entry) => entry.kind));
    for (const kind of EXTENSION_KINDS.filter((candidate) => candidate !== "mod")) {
      expect(realKinds.has(kind)).toBe(true);
    }
    expect(verified.some((entry) => entry.kind === "mod")).toBe(false);
  });

  it("points every verified entry at github or a docs domain", () => {
    for (const entry of verified) {
      if (entry.verification.status !== "verified") continue;
      expect(hasAllowedPrefix(entry.verification.sourceUrl), `${entry.slug} sourceUrl`).toBe(true);
      expect(hasAllowedPrefix(entry.repositoryUrl ?? ""), `${entry.slug} repositoryUrl`).toBe(true);
    }
  });

  it("gives every verified entry a capture date and install commands", () => {
    for (const entry of verified) {
      if (entry.verification.status !== "verified") continue;
      expect(entry.verification.checkedAt).toBe(getCatalogGeneratedAt());
      expect(entry.installCommands.length, `${entry.slug} installCommands`).toBeGreaterThan(0);
    }
  });

  it("never uses an em-dash or en-dash in any string", () => {
    const offenders = collectStrings(rawCatalog).filter((text) => DASH_PATTERN.test(text));
    expect(offenders).toEqual([]);
  });

  it("makes every concept a mod with no install commands, source or stars", () => {
    for (const entry of concepts) {
      expect(entry.kind, entry.slug).toBe("mod");
      expect(entry.installCommands, entry.slug).toEqual([]);
      expect(entry.repositoryUrl, entry.slug).toBeNull();
      expect(entry.stars, entry.slug).toBeNull();
      expect(entry.isFeatured, entry.slug).toBe(false);
      expect(entry.publisher.kind, entry.slug).toBe("spec");
      expect(entry.description.join(" ").toLowerCase(), entry.slug).toContain("proposed design");
    }
  });

  it("only marks real entries as mod when they are concepts", () => {
    for (const entry of all.filter((candidate) => candidate.kind === "mod")) {
      expect(entry.verification.status).toBe("concept");
    }
  });

  it("features at most three entries and none are concepts", () => {
    const featured = getFeaturedExtensions();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThanOrEqual(3);
    expect(featured.every((entry) => entry.verification.status === "verified")).toBe(true);
  });

  it("dates stars with a capture date", () => {
    for (const entry of all) {
      if (entry.stars === null) continue;
      expect(entry.stars.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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
    expect(getExtensionBySlug("feature-dev")?.name).toBe("feature-dev");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getExtensionBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("getRelatedExtensions", () => {
  it("excludes the entry itself and shares a category", () => {
    const source = getExtensionBySlug("hookify");
    expect(source).toBeDefined();
    const related = getRelatedExtensions("hookify");
    expect(related.length).toBeGreaterThan(0);
    for (const entry of related) {
      expect(entry.slug).not.toBe("hookify");
      expect(entry.categories.some((category) => source?.categories.includes(category))).toBe(true);
    }
  });

  it("defaults to three results and respects an explicit limit", () => {
    expect(getRelatedExtensions("feature-dev").length).toBeLessThanOrEqual(3);
    expect(getRelatedExtensions("feature-dev", 1)).toHaveLength(1);
    expect(getRelatedExtensions("feature-dev", 5).length).toBeLessThanOrEqual(5);
  });

  it("returns an empty list for an unknown slug or a non-positive limit", () => {
    expect(getRelatedExtensions("does-not-exist")).toEqual([]);
    expect(getRelatedExtensions("feature-dev", 0)).toEqual([]);
  });
});

describe("counts", () => {
  it("countByKind covers every kind and sums to the total", () => {
    const counts = countByKind();
    expect(Object.keys(counts).sort()).toEqual([...EXTENSION_KINDS].sort());
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(getAllExtensions().length);
    expect(counts.mod).toBe(8);
  });

  it("countByCategory counts an entry once per category it lists", () => {
    const counts = countByCategory();
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const expected = getAllExtensions().reduce((sum, entry) => sum + entry.categories.length, 0);
    expect(total).toBe(expected);
    expect(Object.values(counts).every((count) => count >= 0)).toBe(true);
  });
});
