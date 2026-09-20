import { extensionSchema } from "@/lib/types";
import type { Category, Extension, ExtensionKind } from "@/lib/types";

interface FixtureOptions {
  readonly slug: string;
  readonly name: string;
  readonly kind: ExtensionKind;
  readonly categories: readonly Category[];
  readonly summary?: string;
  readonly tags?: readonly string[];
  readonly hooks?: readonly string[];
  /** null builds a concept entry; a number builds a verified entry with that star count. */
  readonly stars: number | null;
  readonly isFeatured?: boolean;
}

/** Parsed through the real schema so fixtures fail loudly if the contract changes. */
function makeFixture(options: FixtureOptions): Extension {
  const isConcept = options.stars === null;
  const repositoryUrl = `https://github.com/fixture-org/${options.slug}`;
  return extensionSchema.parse({
    slug: options.slug,
    name: options.name,
    kind: options.kind,
    categories: options.categories,
    summary: options.summary ?? `Fixture summary for ${options.name}.`,
    description: ["Fixture description."],
    publisher: { name: "Fixture Publisher", url: null, kind: isConcept ? "spec" : "community" },
    repositoryUrl: isConcept ? null : repositoryUrl,
    license: isConcept ? null : "MIT",
    installCommands: isConcept ? [] : [`/plugin install ${options.slug}`],
    hooks: options.hooks ?? [],
    tags: options.tags ?? [],
    links: [],
    stars: isConcept ? null : { count: options.stars, capturedAt: "2026-05-01" },
    isFeatured: options.isFeatured ?? false,
    verification: isConcept
      ? { status: "concept", specReference: "Fixture spec section" }
      : { status: "verified", checkedAt: "2026-05-02", sourceUrl: repositoryUrl },
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

export const trimConcept = makeFixture({
  slug: "trim-concept",
  name: "Trim Concept",
  kind: "mod",
  categories: ["optimization"],
  stars: null,
});

export const sandboxConcept = makeFixture({
  slug: "sandbox-concept",
  name: "Sandbox Concept",
  kind: "mod",
  categories: ["sandboxing", "security"],
  stars: null,
});

export const browseFixtures: readonly Extension[] = [
  lintRunner,
  docsBridge,
  gitGuard,
  reviewAgent,
  sandboxConcept,
  trimConcept,
];
