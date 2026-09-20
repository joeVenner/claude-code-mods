import { extensionSchema } from "@/lib/types";
import type { Extension, ExtensionKind } from "@/lib/types";

/** Everything a fixture needs to override; the rest gets schema-valid defaults. */
export interface FixtureOptions {
  readonly slug: string;
  readonly name: string;
  readonly kind: ExtensionKind;
  readonly summary?: string;
  readonly tags?: readonly string[];
  readonly hooks?: readonly string[];
  readonly installCommands?: readonly string[];
  readonly isFeatured?: boolean;
  readonly stars?: number | null;
  readonly isConcept?: boolean;
}

/** Builds a fixture through the real schema so it breaks loudly if the contract changes. */
export function buildFixture(options: FixtureOptions): Extension {
  const isConcept = options.isConcept === true;
  return extensionSchema.parse({
    slug: options.slug,
    name: options.name,
    kind: options.kind,
    categories: ["development"],
    summary: options.summary ?? `Summary text for ${options.name}.`,
    description: [`First description paragraph for ${options.name}.`, "Second paragraph."],
    publisher: { name: "Fixture Publisher", url: null, kind: isConcept ? "spec" : "community" },
    repositoryUrl: isConcept ? null : `https://github.com/fixture-org/${options.slug}`,
    license: isConcept ? null : "MIT",
    installCommands: isConcept ? [] : (options.installCommands ?? []),
    hooks: options.hooks ?? [],
    tags: options.tags ?? [],
    links: [],
    stars: isConcept || options.stars === null || options.stars === undefined
      ? null
      : { count: options.stars, capturedAt: "2026-05-01" },
    isFeatured: options.isFeatured ?? false,
    verification: isConcept
      ? { status: "concept", specReference: "Fixture spec section" }
      : {
          status: "verified",
          checkedAt: "2026-05-02",
          sourceUrl: `https://github.com/fixture-org/${options.slug}`,
        },
  });
}

/** Catalog-ordered (featured first) set with more than five entries and two kinds worth filtering. */
export const HOME_FIXTURES: readonly Extension[] = [
  buildFixture({
    slug: "alpha-plugin",
    name: "Alpha Plugin",
    kind: "plugin",
    isFeatured: true,
    tags: ["workflow"],
    hooks: ["PreToolUse"],
    installCommands: ["/plugin install alpha-plugin@fixture-market"],
  }),
  buildFixture({
    slug: "bravo-mcp",
    name: "Bravo MCP",
    kind: "mcp-server",
    isFeatured: true,
    installCommands: ["claude mcp add bravo -- npx -y @fixture/bravo"],
  }),
  buildFixture({ slug: "charlie-plugin", name: "Charlie Plugin", kind: "plugin", tags: ["review"] }),
  buildFixture({ slug: "delta-skill", name: "Delta Skill", kind: "skill", tags: ["review"] }),
  buildFixture({ slug: "echo-agent", name: "Echo Agent", kind: "agent" }),
  buildFixture({ slug: "foxtrot-hook", name: "Foxtrot Hook", kind: "hook", hooks: ["Stop"] }),
  buildFixture({ slug: "golf-command", name: "Golf Command", kind: "command", tags: ["r&d"] }),
  buildFixture({
    slug: "hotel-concept",
    name: "Hotel Concept",
    kind: "mod",
    isConcept: true,
    summary: "Proposed design with no public code.",
  }),
];
