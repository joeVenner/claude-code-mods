import { extensionSchema } from "@/lib/types";
import type { Availability, Detail, Extension, ExtensionKind, Publisher } from "@/lib/types";

/** Everything a fixture needs to override; the rest gets schema-valid defaults. */
export interface FixtureOptions {
  readonly slug: string;
  readonly name: string;
  readonly kind: ExtensionKind;
  readonly summary?: string;
  readonly tags?: readonly string[];
  readonly hooks?: readonly string[];
  readonly availability?: Availability;
  /** Defaults to Anthropic so ordinary fixtures behave like curated entries; pass "community" for submissions. */
  readonly publisherKind?: Publisher["kind"];
  /** Only used when the entry is installable; other availabilities must have none. */
  readonly installCommands?: readonly string[];
  readonly details?: readonly Detail[];
  readonly notice?: string;
  readonly isFeatured?: boolean;
  readonly stars?: number | null;
  readonly repositoryUrl?: string;
}

/** Builds a fixture through the real schema so it breaks loudly if the contract changes. */
export function buildFixture(options: FixtureOptions): Extension {
  const repositoryUrl = options.repositoryUrl ?? `https://github.com/fixture-org/${options.slug}`;
  const availability = options.availability ?? (options.kind === "mod" ? "built-in" : "installable");
  const isInstallable = availability === "installable";
  return extensionSchema.parse({
    slug: options.slug,
    name: options.name,
    kind: options.kind,
    categories: ["development"],
    summary: options.summary ?? `Summary text for ${options.name}.`,
    description: [`First description paragraph for ${options.name}.`, "Second paragraph."],
    publisher: { name: "Fixture Publisher", url: null, kind: options.publisherKind ?? "anthropic" },
    repositoryUrl,
    license: "MIT",
    availability,
    installCommands: isInstallable ? (options.installCommands ?? ["/plugin install fixture"]) : [],
    notice: availability === "built-in" ? (options.notice ?? "Early access. Fixture caveat sentence. Extra detail.") : null,
    details: options.details ?? [],
    guide:
      options.kind === "mod"
        ? [
            { title: "Set up", paragraphs: ["Fixture setup."], commands: [] },
            { title: "Download the source", paragraphs: ["Fixture download."], commands: [] },
          ]
        : [],
    // The schema requires a mod to name at least one event.
    hooks: options.hooks ?? (options.kind === "mod" ? ["session.start"] : []),
    tags: options.tags ?? [],
    links: [],
    stars: options.stars === null || options.stars === undefined ? null : { count: options.stars, capturedAt: "2026-05-01" },
    isFeatured: options.isFeatured ?? false,
    verification: { status: "verified", checkedAt: "2026-05-02", sourceUrl: repositoryUrl },
  });
}

export const RUN_FROM_SOURCE_COMMAND = "claude --plugin-dir mods/fixture-one";

/** Featured built-in mods in the shape of the real catalog: dotted events, one with a wildcard. */
export function buildFeaturedMods(count: number): readonly Extension[] {
  const definitions: readonly FixtureOptions[] = [
    {
      slug: "mod-one",
      name: "mod-one",
      kind: "mod",
      isFeatured: true,
      hooks: ["classic.*", "prompt.section", "prompt.context", "tool.list", "tool.register"],
      details: [
        { label: "Version", value: "0.1.0", isCommand: false },
        { label: "Run from source", value: RUN_FROM_SOURCE_COMMAND, isCommand: true },
        { label: "Test", value: "claude plugin test mods/fixture-one", isCommand: true },
      ],
    },
    { slug: "mod-two", name: "mod-two", kind: "mod", isFeatured: true, hooks: ["session.start", "tool.call"] },
    { slug: "mod-three", name: "mod-three", kind: "mod", isFeatured: true, hooks: ["engine.create"] },
    { slug: "mod-four", name: "mod-four", kind: "mod", isFeatured: true, hooks: ["session.start", "ui.render", "ui.close", "ui.focus"] },
    { slug: "mod-five", name: "mod-five", kind: "mod", isFeatured: true, hooks: ["agent.spawn"] },
  ];
  return definitions.slice(0, count).map((definition) =>
    buildFixture({
      ...definition,
      // One repository for all of them, like the real mods that live side by side in a single repo.
      repositoryUrl: `https://github.com/fixture-vendor/fixture-repo/tree/main/mods/${definition.slug}`,
    }),
  );
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
    slug: "hotel-mod",
    name: "Hotel Mod",
    kind: "mod",
    hooks: ["session.start"],
    summary: "Built in mod that hooks the session start.",
  }),
];
