import { extensionSchema } from "@/lib/types";
import type { Availability, Category, Extension, ExtensionKind } from "@/lib/types";

interface FixtureOptions {
  readonly slug: string;
  readonly name: string;
  readonly kind: ExtensionKind;
  readonly categories: readonly Category[];
  readonly summary?: string;
  readonly tags?: readonly string[];
  readonly hooks?: readonly string[];
  readonly availability?: Availability;
  /** null builds an entry with no captured star count. */
  readonly stars: number | null;
  readonly isFeatured?: boolean;
}

/** Parsed through the real schema so fixtures fail loudly if the contract changes. */
function makeFixture(options: FixtureOptions): Extension {
  const availability = options.availability ?? "installable";
  const repositoryUrl = `https://github.com/fixture-org/${options.slug}`;
  return extensionSchema.parse({
    slug: options.slug,
    name: options.name,
    kind: options.kind,
    categories: options.categories,
    summary: options.summary ?? `Fixture summary for ${options.name}.`,
    description: ["Fixture description."],
    // Only Anthropic can list built-in entries; everything else is a community submission.
    publisher: { name: "Fixture Publisher", url: null, kind: availability === "built-in" ? "anthropic" : "community" },
    repositoryUrl,
    license: "MIT",
    availability,
    installCommands: availability === "installable" ? [`/plugin install ${options.slug}`] : [],
    notice: availability === "built-in" ? "Fixture early access notice." : null,
    details: [],
    guide:
      options.kind === "mod"
        ? [
            { title: "Set up", paragraphs: ["Fixture setup."], commands: ["claude --plugin-dir mods/fixture"] },
            { title: "Download the source", paragraphs: ["Fixture download."], commands: [] },
          ]
        : [],
    hooks: options.hooks ?? [],
    tags: options.tags ?? [],
    links: [],
    stars: options.stars === null ? null : { count: options.stars, capturedAt: "2026-05-01" },
    isFeatured: options.isFeatured ?? false,
    verification: { status: "verified", checkedAt: "2026-05-02", sourceUrl: repositoryUrl },
  });
}

/** Catalog order: featured first, then by name, like `getAllExtensions()`. */
export const lintRunner = makeFixture({
  slug: "lint-runner",
  name: "Lint Runner",
  kind: "plugin",
  categories: ["quality", "development"],
  tags: ["lint", "eslint"],
  hooks: ["PostToolUse"],
  stars: 100,
  isFeatured: true,
});

export const gitGuard = makeFixture({
  slug: "git-guard",
  name: "Git Guard",
  kind: "hook",
  categories: ["security", "workflow"],
  tags: ["git"],
  hooks: ["PreToolUse"],
  stars: 250,
});

export const docsBridge = makeFixture({
  slug: "docs-bridge",
  name: "Docs Bridge",
  kind: "mcp-server",
  categories: ["integration"],
  summary: "Serves project documentation to the session for lint-free answers.",
  stars: 100,
});

export const reviewAgent = makeFixture({
  slug: "review-agent",
  name: "Review Agent",
  kind: "agent",
  categories: ["quality"],
  tags: ["review"],
  stars: 7,
});

export const paneMod = makeFixture({
  slug: "pane-mod",
  name: "Pane Mod",
  kind: "mod",
  categories: ["optimization"],
  hooks: ["session.start", "ui.render"],
  availability: "built-in",
  stars: null,
});

export const policyMod = makeFixture({
  slug: "policy-mod",
  name: "Policy Mod",
  kind: "mod",
  categories: ["sandboxing", "security"],
  hooks: ["classic.*", "tool.list"],
  availability: "built-in",
  stars: null,
});

export const sourceSkill = makeFixture({
  slug: "source-skill",
  name: "Source Skill",
  kind: "skill",
  categories: ["development"],
  availability: "source-only",
  stars: null,
});

export const browseFixtures: readonly Extension[] = [
  lintRunner,
  docsBridge,
  gitGuard,
  reviewAgent,
  paneMod,
  policyMod,
  sourceSkill,
];
