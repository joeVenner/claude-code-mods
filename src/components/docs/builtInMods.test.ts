import { describe, expect, it } from "vitest";
import { extensionSchema } from "@/lib/types";
import type { Extension } from "@/lib/types";
import { pickExampleMod, pickSecurityMod, repositoryNameOf, selectAnthropicBuiltInMods, sharedNotice } from "./builtInMods";
import { EXAMPLE_ENTRY, EXAMPLE_GUIDE } from "./publishContent";

function build(overrides: Record<string, unknown>): Extension {
  return extensionSchema.parse({ ...EXAMPLE_ENTRY, ...overrides });
}

const ANTHROPIC = { name: "Anthropic", url: "https://github.com/anthropics", kind: "anthropic" } as const;
const MOD_BASE = { kind: "mod", guide: [...EXAMPLE_GUIDE], hooks: ["session.start"] } as const;

const BUILT_IN_OTHER = build({
  ...MOD_BASE,
  slug: "fixture-other",
  publisher: ANTHROPIC,
  availability: "built-in",
  categories: ["workflow"],
  repositoryUrl: "https://github.com/anthropics/claude-code/tree/main/mods/fixture-other",
  notice: "Early access fixture notice.",
});
const BUILT_IN_SECURITY = build({
  ...MOD_BASE,
  slug: "fixture-security",
  publisher: ANTHROPIC,
  availability: "built-in",
  categories: ["security"],
  repositoryUrl: "https://github.com/anthropics/claude-code/tree/main/mods/fixture-security",
  notice: "Early access fixture notice.",
});
const COMMUNITY_MOD = build({ ...MOD_BASE, slug: "fixture-community-mod" });
const ANTHROPIC_PLUGIN = build({ slug: "fixture-plugin", publisher: ANTHROPIC, availability: "built-in" });
const ANTHROPIC_SOURCE_ONLY_MOD = build({ ...MOD_BASE, slug: "fixture-source-only", publisher: ANTHROPIC });

describe("selectAnthropicBuiltInMods", () => {
  it("keeps only Anthropic mods that are built in", () => {
    const selected = selectAnthropicBuiltInMods([
      BUILT_IN_OTHER,
      COMMUNITY_MOD,
      ANTHROPIC_PLUGIN,
      ANTHROPIC_SOURCE_ONLY_MOD,
      BUILT_IN_SECURITY,
    ]);
    expect(selected.map((mod) => mod.slug)).toEqual(["fixture-other", "fixture-security"]);
  });

  it("never selects a community mod, so the built-in wording cannot describe one", () => {
    expect(selectAnthropicBuiltInMods([COMMUNITY_MOD])).toEqual([]);
  });

  it("returns an empty list for an empty catalog", () => {
    expect(selectAnthropicBuiltInMods([])).toEqual([]);
  });
});

describe("pickExampleMod", () => {
  it("prefers a security mod and otherwise takes the first", () => {
    expect(pickExampleMod([BUILT_IN_OTHER, BUILT_IN_SECURITY])?.slug).toBe("fixture-security");
    expect(pickExampleMod([BUILT_IN_OTHER])?.slug).toBe("fixture-other");
  });

  it("is undefined when there are no mods", () => {
    expect(pickExampleMod([])).toBeUndefined();
  });
});

describe("pickSecurityMod", () => {
  const SEC_DEFAULT_URL = "https://github.com/anthropics/claude-code/tree/main/mods/sec-default";
  const POLICY_MOD = build({
    ...MOD_BASE,
    slug: "fixture-policy",
    publisher: ANTHROPIC,
    availability: "built-in",
    categories: ["security"],
    hooks: ["classic.*", "prompt.section"],
    repositoryUrl: SEC_DEFAULT_URL,
    notice: "Early access fixture notice.",
  });

  it("picks the mod whose source is mods/sec-default", () => {
    expect(pickSecurityMod([BUILT_IN_OTHER, BUILT_IN_SECURITY, POLICY_MOD])?.slug).toBe("fixture-policy");
  });

  it("does not pick a mod outside that repository, even one in the security category that hooks every classic event", () => {
    expect(pickSecurityMod([BUILT_IN_SECURITY])).toBeUndefined();
  });

  it("returns undefined for no mods, so the page leaves the mod-specific facts out", () => {
    expect(pickSecurityMod([])).toBeUndefined();
  });

  it("chooses by repository, not by name, so a renamed sec-default keeps the facts and a same-shaped mod merely named sec-default does not", () => {
    const renamed = { ...POLICY_MOD, slug: "renamed-policy", name: "Renamed" };
    const lookalike = build({
      ...MOD_BASE,
      slug: "sec-default",
      name: "sec-default",
      publisher: ANTHROPIC,
      availability: "built-in",
      categories: ["security"],
      hooks: ["classic.*"],
      repositoryUrl: BUILT_IN_OTHER.repositoryUrl,
      notice: "n",
    });
    expect(pickSecurityMod([renamed])?.slug).toBe("renamed-policy");
    expect(pickSecurityMod([lookalike])).toBeUndefined();
  });
});

describe("repositoryNameOf", () => {
  it("reads owner/repo from github.com URLs, including folder URLs", () => {
    expect(repositoryNameOf("https://github.com/anthropics/claude-code/tree/main/mods/diff")).toBe(
      "anthropics/claude-code",
    );
    expect(repositoryNameOf("https://github.com/owner/repo/")).toBe("owner/repo");
  });

  it("returns null for other hosts, bare owners and non-URLs", () => {
    expect(repositoryNameOf("https://code.claude.com/docs/en/plugins")).toBeNull();
    expect(repositoryNameOf("https://github.com/owner")).toBeNull();
    expect(repositoryNameOf("not a url")).toBeNull();
  });
});

describe("sharedNotice", () => {
  it("returns the notice only when every mod carries the same one", () => {
    expect(sharedNotice([BUILT_IN_OTHER, BUILT_IN_SECURITY])).toBe("Early access fixture notice.");
    const different = build({ ...MOD_BASE, slug: "fixture-different", publisher: ANTHROPIC, availability: "built-in", notice: "Another." });
    expect(sharedNotice([BUILT_IN_OTHER, different])).toBeNull();
  });

  it("is null for no mods or a mod without a notice", () => {
    expect(sharedNotice([])).toBeNull();
    expect(sharedNotice([ANTHROPIC_SOURCE_ONLY_MOD])).toBeNull();
  });
});
