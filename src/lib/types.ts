import { z } from "zod";
import { isAllowedCatalogUrl } from "@/lib/url";

/**
 * Catalog contract shared by the data layer, UI primitives and pages.
 * Every catalog entry is validated against `extensionSchema` at load time.
 *
 * Two separate datasets exist on purpose:
 * - extensions: real, published things whose source URL was checked (including Anthropic's own mods);
 * - ideas: proposals from the marketplace spec that have no public implementation. Ideas never
 *   appear in the directory, its counts or its search.
 */

export const EXTENSION_KINDS = [
  "plugin",
  "skill",
  "agent",
  "hook",
  "mcp-server",
  "command",
  "mod",
] as const;
export type ExtensionKind = (typeof EXTENSION_KINDS)[number];

export const CATEGORIES = [
  "security",
  "workflow",
  "development",
  "integration",
  "optimization",
  "observability",
  "sandboxing",
  "quality",
  "accessibility",
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * How a user gets the thing.
 * - `installable`: has documented install commands (a plugin marketplace or `claude mcp add`).
 * - `built-in`: ships inside Claude Code itself; the source is published for reading.
 * - `source-only`: public source only, with no documented install command.
 */
export const AVAILABILITIES = ["installable", "built-in", "source-only"] as const;
export type Availability = (typeof AVAILABILITIES)[number];

/** Human-readable labels, so pages never hand-format enum values. */
export const KIND_LABELS: Readonly<Record<ExtensionKind, string>> = {
  plugin: "Plugin",
  skill: "Skill",
  agent: "Agent",
  hook: "Hook",
  "mcp-server": "MCP server",
  command: "Command",
  mod: "Mod",
};

export const CATEGORY_LABELS: Readonly<Record<Category, string>> = {
  security: "Security",
  workflow: "Workflow",
  development: "Development",
  integration: "Integration",
  optimization: "Optimization",
  observability: "Observability",
  sandboxing: "Sandboxing",
  quality: "Quality",
  accessibility: "Accessibility",
};

export const AVAILABILITY_LABELS: Readonly<Record<Availability, string>> = {
  installable: "Installable",
  "built-in": "Built in",
  "source-only": "Source only",
};

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const catalogUrl = z
  .url()
  .refine(isAllowedCatalogUrl, "must be an https URL on an allowed host, without credentials");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * Every extension is verified: `sourceUrl` returned HTTP 200 on `checkedAt`. This says the source
 * exists, NOT that the code was reviewed or security-scanned (no scanner exists yet).
 */
export const verificationSchema = z.object({
  status: z.literal("verified"),
  checkedAt: isoDate,
  sourceUrl: catalogUrl,
});
export type Verification = z.infer<typeof verificationSchema>;

export const publisherSchema = z.object({
  name: z.string().min(1),
  url: catalogUrl.nullable(),
  kind: z.enum(["anthropic", "mcp-project", "community"]),
});
export type Publisher = z.infer<typeof publisherSchema>;

/** A labelled fact shown on the detail page, for things that do not deserve a schema field each. */
export const detailSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  /** True when `value` is a command a reader would run, so the page renders it as a copyable row. */
  isCommand: z.boolean(),
});
export type Detail = z.infer<typeof detailSchema>;

/**
 * A titled block of the long-form guide on a detail page: what it is, how it works, how to set it up,
 * how to download the source. Commands render as copyable rows under the paragraphs.
 */
export const guideSectionSchema = z.object({
  title: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  commands: z.array(z.string().min(1)).default([]),
});
export type GuideSection = z.infer<typeof guideSectionSchema>;

/** Section titles a mod guide must contain, so every mod page explains setup and where to get the source. */
export const GUIDE_SETUP_TITLE = /set\s?up/i;
export const GUIDE_DOWNLOAD_TITLE = /download/i;

export const extensionSchema = z
  .object({
    slug,
    name: z.string().min(1),
    kind: z.enum(EXTENSION_KINDS),
    categories: z.array(z.enum(CATEGORIES)).min(1),
    summary: z.string().min(1).max(160),
    description: z.array(z.string().min(1)).min(1),
    publisher: publisherSchema,
    /** Public source location. Always present: an entry without public source is an idea, not an extension. */
    repositoryUrl: catalogUrl,
    /** License as the source states it, or null when none is stated. Never guessed. */
    license: z.string().nullable(),
    availability: z.enum(AVAILABILITIES),
    /** Commands a user can run to install it. Required for `installable`, empty otherwise. */
    installCommands: z.array(z.string().min(1)),
    /** Caveat a reader must see before using the entry (for example early access), or null. */
    notice: z.string().min(1).nullable(),
    /** Extra labelled facts, such as where a mod is seated or how to run it from source. */
    details: z.array(detailSchema),
    /**
     * Long-form explanation in reading order (overview, how it works, setup, download, configuration).
     * Required for mods, optional elsewhere. Written from the entry's own source, never invented.
     */
    guide: z.array(guideSectionSchema).default([]),
    /** Claude Code lifecycle events the entry hooks, as named in its own source. */
    hooks: z.array(z.string().min(1)),
    tags: z.array(z.string().min(1)),
    links: z.array(z.object({ label: z.string().min(1), url: catalogUrl })),
    /** GitHub stars captured at `capturedAt`. Null when not captured; submitters cannot claim them. */
    stars: z.object({ count: z.number().int().nonnegative(), capturedAt: isoDate }).nullable(),
    isFeatured: z.boolean(),
    verification: verificationSchema,
  })
  .superRefine((entry, ctx) => {
    const hasInstallCommands = entry.installCommands.length > 0;
    if (entry.availability === "installable" && !hasInstallCommands) {
      ctx.addIssue({ code: "custom", message: "installable entries need at least one install command" });
    }
    if (entry.availability !== "installable" && hasInstallCommands) {
      ctx.addIssue({ code: "custom", message: `${entry.availability} entries must not have install commands` });
    }
    // A mod is a plugin whose behaviour lives in a hooks module, so an entry with no hooks is not one.
    if (entry.kind === "mod" && entry.hooks.length === 0) {
      ctx.addIssue({ code: "custom", message: "mod entries must list the events they hook" });
    }
    // A mod without setup and download guidance is not usable, so a listing cannot omit it.
    if (entry.kind === "mod") {
      const hasSection = (pattern: RegExp): boolean => entry.guide.some((section) => pattern.test(section.title));
      if (!hasSection(GUIDE_SETUP_TITLE)) {
        ctx.addIssue({ code: "custom", message: 'mod guides need a section whose title contains "set up" or "setup"' });
      }
      if (!hasSection(GUIDE_DOWNLOAD_TITLE)) {
        ctx.addIssue({ code: "custom", message: 'mod guides need a section whose title contains "download"' });
      }
    }
    // Built in means "ships inside Claude Code", which only Anthropic can say about its own mods.
    if (entry.availability === "built-in" && entry.publisher.kind !== "anthropic") {
      ctx.addIssue({ code: "custom", message: 'only Anthropic publishers can list availability "built-in"' });
    }
  });
export type Extension = z.infer<typeof extensionSchema>;

export const catalogSchema = z.object({
  version: z.literal(1),
  generatedAt: isoDate,
  extensions: z
    .array(extensionSchema)
    .refine(
      (entries) => new Set(entries.map((entry) => entry.slug)).size === entries.length,
      "duplicate slug in catalog",
    ),
});
export type Catalog = z.infer<typeof catalogSchema>;

/**
 * A proposal from the marketplace spec. It has no public implementation, so it has no repository,
 * install command, stars or verification, and it lives on the Ideas page, not in the directory.
 */
export const ideaSchema = z.object({
  slug,
  name: z.string().min(1),
  summary: z.string().min(1).max(160),
  description: z.array(z.string().min(1)).min(1),
  /** Event names exactly as the spec writes them. They may not match the real engine's names. */
  proposedEvents: z.array(z.string().min(1)),
  /** Where in the spec reports the idea is described. */
  specReference: z.string().min(1),
});
export type Idea = z.infer<typeof ideaSchema>;

export const ideasFileSchema = z.object({
  version: z.literal(1),
  /** Date the spec reports were last read for this list, so the Ideas page can say how fresh it is. */
  checkedAt: isoDate,
  ideas: z
    .array(ideaSchema)
    .refine(
      (entries) => new Set(entries.map((entry) => entry.slug)).size === entries.length,
      "duplicate slug in ideas",
    ),
});
export type IdeasFile = z.infer<typeof ideasFileSchema>;

/**
 * Which part of Claude Code's function hooks declares an event.
 * - `engine`: the engine's own lifecycle (`session.start`, `tool.call`, `ui.render`).
 * - `op`: one call on the `$` object (`fs.write`, `http.fetch`).
 * - `classic`: a classic hook event bridged in as `classic.<Name>` (`classic.PreToolUse`).
 * Events a plugin declares for a noun of its own are not listed: they depend on which plugins are loaded.
 */
export const EVENT_FAMILIES = ["engine", "op", "classic"] as const;
export type EventFamily = (typeof EVENT_FAMILIES)[number];

export const EVENT_FAMILY_LABELS: Readonly<Record<EventFamily, string>> = {
  engine: "Engine",
  op: "Calls on $",
  classic: "Classic",
};

/**
 * One event name, as Anthropic's type declarations spell it, with the line it is declared on.
 * Nothing else from the declarations is stored: they are published under "All rights reserved"
 * terms, so this site links to them at a pinned commit and does not reproduce their text.
 */
export const eventSchema = z
  .object({
    name: z.string().regex(/^[a-z]{1,32}\.[A-Za-z]{1,64}$/, "expected <noun>.<name>, for example tool.call"),
    family: z.enum(EVENT_FAMILIES),
    /** One-based line in the declarations file at the pinned commit. */
    line: z.number().int().positive().max(1_000_000),
  })
  .superRefine((event, ctx) => {
    const isClassicName = event.name.startsWith("classic.");
    if (isClassicName !== (event.family === "classic")) {
      ctx.addIssue({ code: "custom", message: 'only classic events are named "classic.<Name>", and every classic event is' });
    }
  });
export type HookEvent = z.infer<typeof eventSchema>;

export const eventsFileSchema = z.object({
  version: z.literal(1),
  /** The upstream commit the names were read from, so every event can link to its source line. */
  source: z.object({
    repository: z.literal("anthropics/claude-code"),
    path: z.literal("mods/types/claude-code.d.ts"),
    sha: z.string().regex(/^[0-9a-f]{40}$/, "expected a full lowercase commit hash"),
    /** Claude Code version named in the declarations' first comment, or null when it names none. */
    claudeCodeVersion: z.string().regex(/^\d{1,4}\.\d{1,4}\.\d{1,6}$/).nullable(),
    syncedAt: isoDate,
  }),
  events: z
    .array(eventSchema)
    .min(1)
    // Far above the 125 events today; a larger file is more likely a bad sync than a real API.
    .max(500)
    .refine((events) => new Set(events.map((event) => event.name)).size === events.length, "duplicate event name"),
});
export type EventsFile = z.infer<typeof eventsFileSchema>;

/** Filters accepted by the browse page and hero search. All fields are optional. */
export interface SearchFilters {
  readonly query?: string;
  readonly kind?: ExtensionKind;
  readonly category?: Category;
  readonly availability?: Availability;
}
