import { describe, expect, it } from "vitest";
import { HOME_FIXTURES, buildFixture } from "./__fixtures__/extensions";
import { buildBrowseHref, describeResultCount, pickFeatured, pickInstallExamples } from "./home-data";

describe("buildBrowseHref", () => {
  it("returns the bare browse path for no filters", () => {
    expect(buildBrowseHref({ query: "", kind: "all" })).toBe("/browse/");
    expect(buildBrowseHref({ query: "   ", kind: "all" })).toBe("/browse/");
  });

  it("adds only the params that are set", () => {
    expect(buildBrowseHref({ query: "git", kind: "all" })).toBe("/browse/?q=git");
    expect(buildBrowseHref({ query: "", kind: "mcp-server" })).toBe("/browse/?kind=mcp-server");
  });

  it("percent-encodes reserved characters in the query", () => {
    const href = buildBrowseHref({ query: "a&b=c #1", kind: "plugin" });
    expect(href).toBe("/browse/?q=a%26b%3Dc+%231&kind=plugin");
  });
});

describe("describeResultCount", () => {
  it("handles zero, one and many", () => {
    expect(describeResultCount(0, 0)).toBe("No results");
    expect(describeResultCount(1, 1)).toBe("Showing 1 of 1 result");
    expect(describeResultCount(12, 5)).toBe("Showing 5 of 12 results");
  });
});

describe("pickFeatured", () => {
  it("uses the featured entries when there are at least two", () => {
    const featured = HOME_FIXTURES.filter((extension) => extension.isFeatured);
    expect(pickFeatured(featured, HOME_FIXTURES)).toEqual(featured);
  });

  it("caps the featured list at a lead plus three supporting entries", () => {
    const many = ["a", "b", "c", "d", "e", "f"].map((slug) =>
      buildFixture({ slug: `${slug}-item`, name: slug, kind: "plugin", isFeatured: true }),
    );
    expect(pickFeatured(many, many)).toHaveLength(4);
  });

  it("falls back to the most-starred entries, keeping catalog order for ties", () => {
    const all = [
      buildFixture({ slug: "no-stars", name: "No Stars", kind: "plugin" }),
      buildFixture({ slug: "some-stars", name: "Some Stars", kind: "skill", stars: 10 }),
      buildFixture({ slug: "most-stars", name: "Most Stars", kind: "agent", stars: 500 }),
      buildFixture({ slug: "also-none", name: "Also None", kind: "hook" }),
    ];
    const single = [buildFixture({ slug: "only-one", name: "Only One", kind: "plugin", isFeatured: true })];

    const picked = pickFeatured(single, all);

    expect(picked.map((extension) => extension.slug)).toEqual(["most-stars", "some-stars", "no-stars"]);
  });

  it("returns an empty list for an empty catalog", () => {
    expect(pickFeatured([], [])).toEqual([]);
  });
});

describe("pickInstallExamples", () => {
  it("keeps installable verified entries, one per kind, in input order", () => {
    const examples = pickInstallExamples([
      buildFixture({ slug: "first", name: "First", kind: "plugin", installCommands: ["/plugin install first"] }),
      buildFixture({ slug: "same-kind", name: "Same Kind", kind: "plugin", installCommands: ["/plugin install x"] }),
      buildFixture({ slug: "second", name: "Second", kind: "mcp-server", installCommands: ["claude mcp add second"] }),
      buildFixture({ slug: "third", name: "Third", kind: "skill", installCommands: ["npx third"] }),
    ]);
    expect(examples.map((extension) => extension.slug)).toEqual(["first", "second"]);
  });

  it("skips entries without commands and concepts", () => {
    const examples = pickInstallExamples([
      buildFixture({ slug: "no-commands", name: "No Commands", kind: "plugin" }),
      buildFixture({ slug: "concept", name: "Concept", kind: "mod", isConcept: true }),
    ]);
    expect(examples).toEqual([]);
  });
});
