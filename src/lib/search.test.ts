import { describe, expect, it } from "vitest";
import { searchExtensions } from "@/lib/search";
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
    installCommands: [],
    hooks: [],
    tags: [],
    links: [],
    stars: null,
    isFeatured: false,
    verification: { status: "verified", checkedAt: "2026-09-20", sourceUrl: "https://github.com/example/repo" },
    ...overrides,
  };
}

const conceptVerification: Extension["verification"] = { status: "concept", specReference: "Report 03" };

const nameHit = makeEntry({ slug: "zeta-guard", name: "Zeta Guard", categories: ["security"] });
const summaryHit = makeEntry({
  slug: "alpha-tool",
  name: "Alpha Tool",
  summary: "Adds a guard around risky commands.",
  categories: ["security", "workflow"],
});
const tagHit = makeEntry({ slug: "beta-tool", name: "Beta Tool", tags: ["guardrails"], categories: ["quality"] });
const hookHit = makeEntry({ slug: "gamma-tool", name: "Gamma Tool", hooks: ["PreToolUse"], kind: "hook" });
const conceptEntry = makeEntry({
  slug: "delta-concept",
  name: "Delta Concept",
  kind: "mod",
  repositoryUrl: null,
  categories: ["security"],
  verification: conceptVerification,
});

const items: readonly Extension[] = [summaryHit, tagHit, hookHit, nameHit, conceptEntry];

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
    expect(searchExtensions(items, { category: "security" })).toEqual([summaryHit, nameHit, conceptEntry]);
  });

  it("filters by verification status", () => {
    expect(searchExtensions(items, { status: "concept" })).toEqual([conceptEntry]);
    expect(searchExtensions(items, { status: "verified" })).toEqual([summaryHit, tagHit, hookHit, nameHit]);
  });

  it("ANDs all filters together, including the query", () => {
    expect(searchExtensions(items, { category: "security", status: "verified", query: "guard" })).toEqual([
      nameHit,
      summaryHit,
    ]);
    expect(searchExtensions(items, { category: "quality", kind: "hook" })).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const snapshot = [...items];
    searchExtensions(items, { query: "guard" });
    expect(items).toEqual(snapshot);
  });
});
