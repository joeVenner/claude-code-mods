import { describe, expect, it } from "vitest";
import {
  DEFAULT_BROWSE_STATE,
  MAX_QUERY_LENGTH,
  applyBrowseState,
  clearFilters,
  countActiveFilters,
  countByFacet,
  countWithoutFacet,
  hasActiveFilters,
  normalizeQuery,
  parseFilters,
  serializeFilters,
} from "./filters";
import type { BrowseState } from "./filters";
import {
  browseFixtures,
  docsBridge,
  gitGuard,
  lintRunner,
  reviewAgent,
  sandboxConcept,
  trimConcept,
} from "./__fixtures__/browseItems";
import { CATEGORIES, EXTENSION_KINDS } from "@/lib/types";

function stateWith(overrides: Partial<BrowseState>): BrowseState {
  return { ...DEFAULT_BROWSE_STATE, ...overrides };
}

function slugs(items: readonly { readonly slug: string }[]): readonly string[] {
  return items.map((item) => item.slug);
}

describe("parseFilters", () => {
  it("returns the defaults for an empty query string", () => {
    expect(parseFilters(new URLSearchParams(""))).toEqual(DEFAULT_BROWSE_STATE);
  });

  it("reads every supported key", () => {
    const state = parseFilters(
      new URLSearchParams("q=lint&kind=plugin&category=quality&status=verified&sort=stars"),
    );
    expect(state).toEqual({
      query: "lint",
      kind: "plugin",
      category: "quality",
      status: "verified",
      sort: "stars",
    });
  });

  it("ignores unknown enum values instead of throwing", () => {
    const state = parseFilters(
      new URLSearchParams("kind=widget&category=nope&status=maybe&sort=random"),
    );
    expect(state).toEqual(DEFAULT_BROWSE_STATE);
  });

  it("treats enum values as case sensitive", () => {
    expect(parseFilters(new URLSearchParams("kind=Plugin")).kind).toBeNull();
  });

  it("keeps valid keys when others are invalid", () => {
    const state = parseFilters(new URLSearchParams("kind=hook&category=nope&sort=name"));
    expect(state.kind).toBe("hook");
    expect(state.category).toBeNull();
    expect(state.sort).toBe("name");
  });

  it("uses the first value of a repeated key", () => {
    expect(parseFilters(new URLSearchParams("kind=hook&kind=agent")).kind).toBe("hook");
  });

  it("ignores unrelated keys", () => {
    expect(parseFilters(new URLSearchParams("utm_source=x&page=2"))).toEqual(DEFAULT_BROWSE_STATE);
  });

  it("trims the query and caps its length", () => {
    expect(parseFilters(new URLSearchParams("q=%20%20lint%20%20")).query).toBe("lint");
    const longQuery = "a".repeat(MAX_QUERY_LENGTH + 50);
    expect(parseFilters(new URLSearchParams({ q: longQuery })).query).toHaveLength(MAX_QUERY_LENGTH);
  });

  it("decodes encoded characters in the query", () => {
    expect(parseFilters(new URLSearchParams("q=mcp%20server%20%26%20git")).query).toBe("mcp server & git");
  });

  it("treats an empty value as unset", () => {
    expect(parseFilters(new URLSearchParams("q=&kind=&sort="))).toEqual(DEFAULT_BROWSE_STATE);
  });
});

describe("serializeFilters", () => {
  it("omits defaults", () => {
    expect(serializeFilters(DEFAULT_BROWSE_STATE)).toBe("");
  });

  it("omits an explicit default sort but keeps other sorts", () => {
    expect(serializeFilters(stateWith({ sort: "featured" }))).toBe("");
    expect(serializeFilters(stateWith({ sort: "name" }))).toBe("sort=name");
  });

  it("uses a stable key order regardless of how the state was built", () => {
    const state = stateWith({
      sort: "stars",
      status: "concept",
      category: "quality",
      kind: "mod",
      query: "lint",
    });
    expect(serializeFilters(state)).toBe("q=lint&kind=mod&category=quality&status=concept&sort=stars");
  });

  it("encodes special characters and trims the query", () => {
    expect(serializeFilters(stateWith({ query: "  a&b c " }))).toBe("q=a%26b+c");
  });

  it("drops a query that is only whitespace", () => {
    expect(serializeFilters(stateWith({ query: "   " }))).toBe("");
  });

  it("round-trips through parseFilters", () => {
    const states: readonly BrowseState[] = [
      DEFAULT_BROWSE_STATE,
      stateWith({ query: "git hooks", kind: "hook" }),
      stateWith({ category: "security", status: "verified", sort: "name" }),
      stateWith({ query: "a&b=c#d", kind: "mcp-server", category: "integration", status: "concept", sort: "stars" }),
    ];
    for (const state of states) {
      expect(parseFilters(new URLSearchParams(serializeFilters(state)))).toEqual(state);
    }
  });

  it("round-trips every kind and category", () => {
    for (const kind of EXTENSION_KINDS) {
      expect(parseFilters(new URLSearchParams(serializeFilters(stateWith({ kind }))))).toEqual(stateWith({ kind }));
    }
    for (const category of CATEGORIES) {
      expect(parseFilters(new URLSearchParams(serializeFilters(stateWith({ category }))))).toEqual(
        stateWith({ category }),
      );
    }
  });
});

describe("normalizeQuery", () => {
  it("trims, caps, and re-trims after the cap", () => {
    expect(normalizeQuery("  hi  ")).toBe("hi");
    const cappedAtSpace = `${"a".repeat(MAX_QUERY_LENGTH - 1)} tail`;
    expect(normalizeQuery(cappedAtSpace)).toBe("a".repeat(MAX_QUERY_LENGTH - 1));
  });
});

describe("hasActiveFilters and countActiveFilters", () => {
  it("is false for the defaults", () => {
    expect(hasActiveFilters(DEFAULT_BROWSE_STATE)).toBe(false);
    expect(countActiveFilters(DEFAULT_BROWSE_STATE)).toBe(0);
  });

  it("is true for a query, kind, category, or status", () => {
    expect(hasActiveFilters(stateWith({ query: "x" }))).toBe(true);
    expect(hasActiveFilters(stateWith({ kind: "hook" }))).toBe(true);
    expect(hasActiveFilters(stateWith({ category: "quality" }))).toBe(true);
    expect(hasActiveFilters(stateWith({ status: "concept" }))).toBe(true);
  });

  it("ignores whitespace-only queries", () => {
    expect(hasActiveFilters(stateWith({ query: "   " }))).toBe(false);
  });

  it("does not count sort as a filter", () => {
    expect(hasActiveFilters(stateWith({ sort: "stars" }))).toBe(false);
  });

  it("counts facets but not the query", () => {
    expect(countActiveFilters(stateWith({ query: "x", kind: "hook", status: "verified" }))).toBe(2);
  });
});

describe("clearFilters", () => {
  it("resets query and facets but keeps the sort", () => {
    const cleared = clearFilters(stateWith({ query: "x", kind: "hook", category: "quality", status: "verified", sort: "name" }));
    expect(cleared).toEqual(stateWith({ sort: "name" }));
  });
});

describe("applyBrowseState", () => {
  it("returns everything in input order for the default state", () => {
    expect(slugs(applyBrowseState(browseFixtures, DEFAULT_BROWSE_STATE))).toEqual(slugs(browseFixtures));
  });

  it("filters by kind, category and status together", () => {
    expect(slugs(applyBrowseState(browseFixtures, stateWith({ kind: "mod" })))).toEqual([
      sandboxConcept.slug,
      trimConcept.slug,
    ]);
    expect(slugs(applyBrowseState(browseFixtures, stateWith({ category: "quality", status: "verified" })))).toEqual([
      lintRunner.slug,
      reviewAgent.slug,
    ]);
    expect(slugs(applyBrowseState(browseFixtures, stateWith({ status: "concept", category: "security" })))).toEqual([
      sandboxConcept.slug,
    ]);
  });

  it("searches with the data layer and ranks name hits above summary hits", () => {
    const results = applyBrowseState(browseFixtures, stateWith({ query: "lint" }));
    expect(slugs(results)).toEqual([lintRunner.slug, docsBridge.slug]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(applyBrowseState(browseFixtures, stateWith({ query: "zzz-no-match" }))).toEqual([]);
  });

  it("sorts by name ascending", () => {
    const names = applyBrowseState(browseFixtures, stateWith({ sort: "name" })).map((item) => item.name);
    expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right)));
  });

  it("sorts by stars descending with missing counts last", () => {
    const results = applyBrowseState(browseFixtures, stateWith({ sort: "stars" }));
    expect(results.map((item) => item.stars?.count ?? null)).toEqual([250, 100, 100, 7, null, null]);
  });

  it("keeps input order for equal star counts and for entries without stars", () => {
    const results = slugs(applyBrowseState(browseFixtures, stateWith({ sort: "stars" })));
    expect(results.indexOf(lintRunner.slug)).toBeLessThan(results.indexOf(docsBridge.slug));
    expect(results.indexOf(sandboxConcept.slug)).toBeLessThan(results.indexOf(trimConcept.slug));
    expect(results.indexOf(gitGuard.slug)).toBe(0);
  });

  it("applies the sort after the filter", () => {
    const results = applyBrowseState(browseFixtures, stateWith({ status: "verified", sort: "stars" }));
    expect(slugs(results)).toEqual([gitGuard.slug, lintRunner.slug, docsBridge.slug, reviewAgent.slug]);
  });

  it("does not mutate the input array", () => {
    const before = slugs(browseFixtures);
    applyBrowseState(browseFixtures, stateWith({ sort: "name" }));
    applyBrowseState(browseFixtures, stateWith({ sort: "stars" }));
    expect(slugs(browseFixtures)).toEqual(before);
  });

  it("handles an empty catalog", () => {
    expect(applyBrowseState([], stateWith({ sort: "stars", query: "x" }))).toEqual([]);
  });
});

describe("countByFacet and countWithoutFacet", () => {
  it("counts each kind with no other filters", () => {
    const counts = countByFacet(browseFixtures, DEFAULT_BROWSE_STATE, "kind", EXTENSION_KINDS);
    expect(counts.plugin).toBe(1);
    expect(counts.mod).toBe(2);
    expect(counts.skill).toBe(0);
  });

  it("holds the other filters and the query fixed", () => {
    const counts = countByFacet(browseFixtures, stateWith({ status: "verified" }), "kind", EXTENSION_KINDS);
    expect(counts.mod).toBe(0);
    expect(counts.plugin).toBe(1);

    const queryCounts = countByFacet(browseFixtures, stateWith({ query: "lint" }), "kind", EXTENSION_KINDS);
    expect(queryCounts.plugin).toBe(1);
    expect(queryCounts["mcp-server"]).toBe(1);
    expect(queryCounts.hook).toBe(0);
  });

  it("ignores the facet's own current selection", () => {
    const counts = countByFacet(browseFixtures, stateWith({ kind: "hook" }), "kind", EXTENSION_KINDS);
    expect(counts.plugin).toBe(1);
    expect(counts.hook).toBe(1);
  });

  it("counts categories against the current kind", () => {
    const counts = countByFacet(browseFixtures, stateWith({ kind: "mod" }), "category", CATEGORIES);
    expect(counts.security).toBe(1);
    expect(counts.optimization).toBe(1);
    expect(counts.quality).toBe(0);
  });

  it("counts statuses", () => {
    const counts = countByFacet(browseFixtures, DEFAULT_BROWSE_STATE, "status", ["verified", "concept"] as const);
    expect(counts).toEqual({ verified: 4, concept: 2 });
  });

  it("counts the unset facet for the All option", () => {
    expect(countWithoutFacet(browseFixtures, stateWith({ kind: "hook" }), "kind")).toBe(browseFixtures.length);
    expect(countWithoutFacet(browseFixtures, stateWith({ kind: "hook", status: "concept" }), "kind")).toBe(2);
  });
});
