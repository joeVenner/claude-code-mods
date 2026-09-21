import { describe, expect, it } from "vitest";
import { searchExtensions, type SearchableExtension } from "@/lib/search";
import type { Extension } from "@/lib/types";

function makeEntry(overrides: Partial<Extension> & Pick<Extension, "slug" | "name">): Extension {
  return {
    kind: "plugin",
    categories: ["workflow"],
    summary: "Generic summary.",
    description: ["Paragraph."],
    publisher: { name: "Publisher", url: null, kind: "community" },
    repositoryUrl: "https://github.com/example/repo",
    license: null,
    availability: "source-only",
    installCommands: [],
    notice: null,
    details: [],
    guide: [],
    hooks: [],
    tags: [],
    links: [],
    stars: null,
    isFeatured: false,
    verification: { status: "verified", checkedAt: "2026-09-20", sourceUrl: "https://github.com/example/repo" },
    ...overrides,
  };
}

const nameHit = makeEntry({ slug: "zeta-guard", name: "Zeta Guard", categories: ["security"] });
const summaryHit = makeEntry({
  slug: "alpha-tool",
  name: "Alpha Tool",
  summary: "Adds a guard around risky commands.",
  categories: ["security", "workflow"],
  availability: "installable",
  installCommands: ["/plugin install alpha-tool@example"],
});
const tagHit = makeEntry({ slug: "beta-tool", name: "Beta Tool", tags: ["guardrails"], categories: ["quality"] });
const hookHit = makeEntry({ slug: "gamma-tool", name: "Gamma Tool", hooks: ["PreToolUse"], kind: "hook" });
const builtInEntry = makeEntry({
  slug: "delta-mod",
  name: "Delta Mod",
  kind: "mod",
  hooks: ["session.start"],
  categories: ["security"],
  availability: "built-in",
});

const items: readonly Extension[] = [summaryHit, tagHit, hookHit, nameHit, builtInEntry];

describe("searchExtensions", () => {
  it("returns everything in input order for an empty filter set", () => {
    expect(searchExtensions(items, {})).toEqual(items);
  });

  it("treats an empty or whitespace-only query like no query", () => {
    expect(searchExtensions(items, { query: "" })).toEqual(items);
    expect(searchExtensions(items, { query: "   \t " })).toEqual(items);
  });

  it("matches case-insensitively", () => {
    expect(searchExtensions(items, { query: "ZETA" })).toEqual([nameHit]);
    expect(searchExtensions(items, { query: "zeta guard" })).toEqual([nameHit]);
  });

  it("matches on slug, tags and hooks", () => {
    expect(searchExtensions(items, { query: "gamma-tool" })).toEqual([hookHit]);
    expect(searchExtensions(items, { query: "guardrails" })).toEqual([tagHit]);
    expect(searchExtensions(items, { query: "pretooluse" })).toEqual([hookHit]);
  });

  it("ranks name hits above tag hits above summary hits", () => {
    const ranked = searchExtensions(items, { query: "guard" });
    expect(ranked).toEqual([nameHit, tagHit, summaryHit]);
  });

  it("keeps input order between results of equal rank", () => {
    const first = makeEntry({ slug: "one-widget", name: "One Widget" });
    const second = makeEntry({ slug: "two-widget", name: "Two Widget" });
    expect(searchExtensions([second, first], { query: "widget" })).toEqual([second, first]);
  });

  it("requires every query word to match", () => {
    expect(searchExtensions(items, { query: "zeta risky" })).toEqual([]);
    expect(searchExtensions(items, { query: "alpha risky" })).toEqual([summaryHit]);
  });

  it("does not search the long description", () => {
    const hidden = makeEntry({ slug: "hidden", name: "Hidden", description: ["mentions needle only here"] });
    expect(searchExtensions([hidden], { query: "needle" })).toEqual([]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(searchExtensions(items, { query: "no-such-thing" })).toEqual([]);
  });

  it("filters by kind", () => {
    expect(searchExtensions(items, { kind: "hook" })).toEqual([hookHit]);
  });

  it("filters by category", () => {
    expect(searchExtensions(items, { category: "security" })).toEqual([summaryHit, nameHit, builtInEntry]);
  });

  it("filters by availability", () => {
    expect(searchExtensions(items, { availability: "built-in" })).toEqual([builtInEntry]);
    expect(searchExtensions(items, { availability: "installable" })).toEqual([summaryHit]);
    expect(searchExtensions(items, { availability: "source-only" })).toEqual([tagHit, hookHit, nameHit]);
  });

  it("matches dotted hook event names", () => {
    expect(searchExtensions(items, { query: "session.start" })).toEqual([builtInEntry]);
  });

  it("ANDs all filters together, including the query", () => {
    expect(searchExtensions(items, { category: "security", availability: "installable", query: "guard" })).toEqual([
      summaryHit,
    ]);
    expect(searchExtensions(items, { category: "security", availability: "source-only", query: "guard" })).toEqual([
      nameHit,
    ]);
    expect(searchExtensions(items, { category: "quality", kind: "hook" })).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const snapshot = [...items];
    searchExtensions(items, { query: "guard" });
    expect(items).toEqual(snapshot);
  });
});

describe("searchExtensions with a slim projection", () => {
  it("accepts objects without the long fields and returns the same objects", () => {
    const slim: SearchableExtension & { readonly extra: number } = {
      slug: "slim-tool",
      name: "Slim Tool",
      kind: "plugin",
      categories: ["workflow"],
      summary: "No description or guide here.",
      tags: [],
      hooks: [],
      availability: "source-only",
      extra: 1,
    };
    const results = searchExtensions([slim], { query: "slim" });
    expect(results).toEqual([slim]);
    expect(results[0].extra).toBe(1);
    expect(searchExtensions([slim], { availability: "built-in" })).toEqual([]);
  });
});
