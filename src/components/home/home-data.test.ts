import { describe, expect, it } from "vitest";
import { HOME_FIXTURES, RUN_FROM_SOURCE_COMMAND, buildFeaturedMods, buildFixture } from "./__fixtures__/extensions";
import {
  buildBrowseHref,
  describeBuiltInMods,
  describeResultCount,
  githubRepositoryName,
  leadSentences,
  pickFeatured,
  pickInstallExamples,
  pickRunFromSource,
  selectBuiltInMods,
  sharedNoticeLead,
  summarizeHooks,
} from "./home-data";

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
  it("uses the featured entries and marks the pick as editorial", () => {
    const featured = HOME_FIXTURES.filter((extension) => extension.isFeatured);
    expect(pickFeatured(featured, HOME_FIXTURES)).toEqual({ extensions: featured, isEditorial: true });
  });

  it("shows a single featured entry as it is instead of swapping in most-starred ones", () => {
    const single = [buildFixture({ slug: "only-one", name: "Only One", kind: "plugin", isFeatured: true })];
    const all = [...single, buildFixture({ slug: "popular", name: "Popular", kind: "skill", stars: 900 })];
    expect(pickFeatured(single, all)).toEqual({ extensions: single, isEditorial: true });
  });

  it("keeps three, four and five featured entries whole", () => {
    for (const count of [3, 4, 5]) {
      const mods = buildFeaturedMods(count);
      expect(pickFeatured(mods, mods).extensions).toHaveLength(count);
    }
  });

  it("caps a long featured list so the section stays scannable", () => {
    const many = ["a", "b", "c", "d", "e", "f", "g", "h"].map((slug) =>
      buildFixture({ slug: `${slug}-item`, name: slug, kind: "plugin", isFeatured: true }),
    );
    expect(pickFeatured(many, many).extensions).toHaveLength(6);
  });

  it("falls back to the most-starred entries when nothing is featured, and says it is not editorial", () => {
    const all = [
      buildFixture({ slug: "no-stars", name: "No Stars", kind: "plugin" }),
      buildFixture({ slug: "some-stars", name: "Some Stars", kind: "skill", stars: 10 }),
      buildFixture({ slug: "most-stars", name: "Most Stars", kind: "agent", stars: 500 }),
      buildFixture({ slug: "tie-a", name: "Tie A", kind: "hook", stars: 10 }),
      buildFixture({ slug: "tie-b", name: "Tie B", kind: "command", stars: 10 }),
    ];

    const pick = pickFeatured([], all);

    expect(pick.isEditorial).toBe(false);
    // Ties keep catalog order and entries without stars never qualify.
    expect(pick.extensions.map((extension) => extension.slug)).toEqual(["most-stars", "some-stars", "tie-a"]);
  });

  it("returns an empty, non-editorial pick when nothing is featured and nothing has stars", () => {
    const all = [buildFixture({ slug: "no-stars", name: "No Stars", kind: "plugin" })];
    expect(pickFeatured([], all)).toEqual({ extensions: [], isEditorial: false });
  });

  it("returns an empty pick for an empty catalog", () => {
    expect(pickFeatured([], [])).toEqual({ extensions: [], isEditorial: false });
  });
});

describe("pickInstallExamples", () => {
  it("keeps installable entries, one per kind, in input order", () => {
    const examples = pickInstallExamples([
      buildFixture({ slug: "first", name: "First", kind: "plugin", installCommands: ["/plugin install first"] }),
      buildFixture({ slug: "same-kind", name: "Same Kind", kind: "plugin", installCommands: ["/plugin install x"] }),
      buildFixture({ slug: "second", name: "Second", kind: "mcp-server", installCommands: ["claude mcp add second"] }),
      buildFixture({ slug: "third", name: "Third", kind: "skill", installCommands: ["npx third"] }),
    ]);
    expect(examples.map((extension) => extension.slug)).toEqual(["first", "second"]);
  });

  it("skips built-in mods and source-only entries", () => {
    const examples = pickInstallExamples([
      ...buildFeaturedMods(4),
      buildFixture({ slug: "source", name: "Source", kind: "skill", availability: "source-only" }),
    ]);
    expect(examples).toEqual([]);
  });

  it("skips community listings and keeps Anthropic and MCP project ones", () => {
    const community = buildFixture({
      slug: "community-plugin",
      name: "Community Plugin",
      kind: "plugin",
      publisherKind: "community",
      installCommands: ["/plugin install community-plugin"],
    });
    const project = buildFixture({
      slug: "project-mcp",
      name: "Project MCP",
      kind: "mcp-server",
      publisherKind: "mcp-project",
      installCommands: ["claude mcp add project"],
    });
    const anthropic = buildFixture({
      slug: "anthropic-skill",
      name: "Anthropic Skill",
      kind: "skill",
      publisherKind: "anthropic",
      installCommands: ["npx anthropic-skill"],
    });
    expect(pickInstallExamples([community, project]).map((extension) => extension.slug)).toEqual(["project-mcp"]);
    expect(pickInstallExamples([community])).toEqual([]);
    expect(pickInstallExamples([community, anthropic]).map((extension) => extension.slug)).toEqual([
      "anthropic-skill",
    ]);
  });

  it("never returns a mod, even one that lists install commands", () => {
    const installableMod = buildFixture({
      slug: "installable-mod",
      name: "Installable Mod",
      kind: "mod",
      availability: "installable",
      installCommands: ["/plugin install installable-mod"],
    });
    expect(pickInstallExamples([installableMod])).toEqual([]);
  });
});

describe("pickRunFromSource", () => {
  it("returns the first entry with a stored Run from source command", () => {
    const [withCommand, withoutCommand] = buildFeaturedMods(2);
    const picked = pickRunFromSource([withoutCommand, withCommand]);
    expect(picked?.extension.slug).toBe(withCommand.slug);
    expect(picked?.command).toBe(RUN_FROM_SOURCE_COMMAND);
  });

  it("ignores a Run from source detail that is not a command and other labels", () => {
    const decoy = buildFixture({
      slug: "decoy",
      name: "Decoy",
      kind: "mod",
      details: [
        { label: "Run from source", value: "Text, not a command", isCommand: false },
        { label: "Test", value: "claude plugin test mods/decoy", isCommand: true },
      ],
    });
    expect(pickRunFromSource([decoy])).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(pickRunFromSource([])).toBeNull();
  });
});

describe("githubRepositoryName", () => {
  it("reads owner and repository from a GitHub URL, ignoring deeper paths", () => {
    expect(githubRepositoryName("https://github.com/anthropics/claude-code/tree/main/mods/diff")).toBe(
      "anthropics/claude-code",
    );
  });

  it("returns null for other hosts, missing repositories and malformed input", () => {
    expect(githubRepositoryName("https://example.org/a/b")).toBeNull();
    expect(githubRepositoryName("https://github.com/anthropics")).toBeNull();
    expect(githubRepositoryName("not a url")).toBeNull();
  });
});

describe("summarizeHooks", () => {
  it("returns null when there are no hooks", () => {
    expect(summarizeHooks([])).toBeNull();
  });

  it("uses the singular for one hook", () => {
    expect(summarizeHooks(["session.start"])).toEqual({
      countLabel: "1 hook",
      shown: ["session.start"],
      hiddenCount: 0,
    });
  });

  it("shows the first three events in order, keeps wildcards as text, and counts the rest", () => {
    expect(summarizeHooks(["classic.*", "prompt.section", "prompt.context", "tool.list", "tool.register"])).toEqual({
      countLabel: "5 hooks",
      shown: ["classic.*", "prompt.section", "prompt.context"],
      hiddenCount: 2,
    });
  });
});

describe("leadSentences", () => {
  it("returns the first sentences and keeps short texts whole", () => {
    expect(leadSentences("One. Two. Three.", 1)).toBe("One.");
    expect(leadSentences("One. Two. Three.", 2)).toBe("One. Two.");
    expect(leadSentences("Only one sentence", 2)).toBe("Only one sentence");
    expect(leadSentences("", 1)).toBe("");
  });
});

describe("sharedNoticeLead", () => {
  it("returns the lead the notices agree on", () => {
    const entries = [{ notice: "Early access. A. B." }, { notice: "Early access. C." }];
    expect(sharedNoticeLead(entries, 1)).toBe("Early access.");
    expect(sharedNoticeLead(entries, 2)).toBeNull();
  });

  it("is null when any notice is missing, or there are no entries", () => {
    expect(sharedNoticeLead([{ notice: "Early access." }, { notice: null }], 1)).toBeNull();
    expect(sharedNoticeLead([{ notice: null }], 1)).toBeNull();
    expect(sharedNoticeLead([], 1)).toBeNull();
  });
});

function communityMod(): ReturnType<typeof buildFixture> {
  return buildFixture({
    slug: "community-mod",
    name: "community-mod",
    kind: "mod",
    publisherKind: "community",
    availability: "source-only",
  });
}

describe("selectBuiltInMods and describeBuiltInMods", () => {
  it("finds no built-in mods in a catalog without Anthropic mods", () => {
    const catalog = [...HOME_FIXTURES.filter((extension) => extension.kind !== "mod"), communityMod()];
    expect(selectBuiltInMods(catalog)).toEqual([]);
    expect(describeBuiltInMods(catalog)).toBeNull();
  });

  it("describes one Anthropic mod in the singular, with the repository and the notice lead", () => {
    const [one] = buildFeaturedMods(1);
    expect(describeBuiltInMods([one, communityMod()])).toBe(
      "Anthropic publishes 1 mod in fixture-vendor/fixture-repo. It ships built in. Early access.",
    );
  });

  it("counts three Anthropic mods and ignores the community mod", () => {
    const mods = buildFeaturedMods(3);
    const catalog = [...mods, communityMod()];
    expect(selectBuiltInMods(catalog)).toHaveLength(3);
    expect(describeBuiltInMods(catalog)).toBe(
      "Anthropic publishes 3 mods in fixture-vendor/fixture-repo. They ship built in. Early access.",
    );
  });

  it("omits the repository when the mods live in more than one, and the caveat when notices differ", () => {
    const first = buildFixture({
      slug: "a-mod",
      name: "a-mod",
      kind: "mod",
      repositoryUrl: "https://github.com/one/repo-a",
      notice: "Early access. Same.",
    });
    const second = buildFixture({
      slug: "b-mod",
      name: "b-mod",
      kind: "mod",
      repositoryUrl: "https://github.com/two/repo-b",
      notice: "Preview only. Different.",
    });
    expect(describeBuiltInMods([first, second])).toBe("Anthropic publishes 2 mods. They ship built in.");
  });

  it("does not hardcode a count word", () => {
    const text = describeBuiltInMods(buildFeaturedMods(5)) ?? "";
    expect(text).toContain("5 mods");
    expect(text).not.toMatch(/\b(four|five|three)\b/i);
  });
});
