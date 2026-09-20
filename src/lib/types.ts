import { z } from "zod";
import { isAllowedCatalogUrl } from "@/lib/url";

/**
 * Catalog contract shared by the data layer, UI primitives and pages.
 * Every catalog entry is validated against `catalogSchema` at load time.
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

/** Human-readable labels, so pages never hand-format enum values. */
export const KIND_LABELS: Readonly<Record<ExtensionKind, string>> = {
  plugin: "Plugin",
  skill: "Skill",
  agent: "Agent",
  hook: "Hook",
  "mcp-server": "MCP server",
  command: "Command",
  mod: "Mod (concept)",
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

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const httpsUrl = z
  .url()
  .refine(isAllowedCatalogUrl, "must be an https URL on an allowed host, without credentials");

/**
 * How trustworthy the entry's claims are.
 * - `verified`: `sourceUrl` returned HTTP 200 on `checkedAt`. This says the source exists,
 *   NOT that the code was security-scanned (no scanner exists yet).
 * - `concept`: described in the marketplace spec reports; no public source exists.
 *   Concepts never carry a verified badge, download count or repository link.
 */
export const verificationSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("verified"),
    checkedAt: isoDate,
    sourceUrl: httpsUrl,
  }),
  z.object({
    status: z.literal("concept"),
    specReference: z.string().min(1),
  }),
]);
export type Verification = z.infer<typeof verificationSchema>;

export const publisherSchema = z.object({
  name: z.string().min(1),
  url: httpsUrl.nullable(),
  kind: z.enum(["anthropic", "mcp-project", "community", "spec"]),
});
export type Publisher = z.infer<typeof publisherSchema>;

export const extensionSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    kind: z.enum(EXTENSION_KINDS),
    categories: z.array(z.enum(CATEGORIES)).min(1),
    summary: z.string().min(1).max(160),
    description: z.array(z.string().min(1)).min(1),
    publisher: publisherSchema,
    /** Public source repository, or null for concepts. */
    repositoryUrl: httpsUrl.nullable(),
    license: z.string().nullable(),
    /** Shell or in-session commands a user can run. Empty when not installable. */
    installCommands: z.array(z.string().min(1)),
    /** Claude Code lifecycle hooks the entry uses, when applicable. */
    hooks: z.array(z.string().min(1)),
    tags: z.array(z.string().min(1)),
    links: z.array(z.object({ label: z.string().min(1), url: httpsUrl })),
    /** GitHub stars captured at `capturedAt`. Omitted for concepts. */
    stars: z.object({ count: z.number().int().nonnegative(), capturedAt: isoDate }).nullable(),
    isFeatured: z.boolean(),
    verification: verificationSchema,
  })
  .superRefine((entry, ctx) => {
    // A concept is exactly a "mod" entry: keeps a real extension from being mislabelled and vice versa.
    const isConcept = entry.verification.status === "concept";
    if (isConcept !== (entry.kind === "mod")) {
      ctx.addIssue({ code: "custom", message: 'only concept entries may have kind "mod", and every concept must' });
    }
    if (isConcept && entry.isFeatured) {
      ctx.addIssue({ code: "custom", message: "concept entries must not be featured" });
    }
    if (isConcept && entry.links.length > 0) {
      ctx.addIssue({ code: "custom", message: "concept entries must not have links" });
    }
    if (entry.verification.status === "concept") {
      if (entry.repositoryUrl !== null) {
        ctx.addIssue({ code: "custom", message: "concept entries must not have a repositoryUrl" });
      }
      if (entry.stars !== null) {
        ctx.addIssue({ code: "custom", message: "concept entries must not have stars" });
      }
      if (entry.installCommands.length > 0) {
        ctx.addIssue({ code: "custom", message: "concept entries must not have install commands" });
      }
    } else if (entry.repositoryUrl === null) {
      ctx.addIssue({ code: "custom", message: "verified entries need a repositoryUrl" });
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

/** Filters accepted by the browse page and hero search. All fields are optional. */
export interface SearchFilters {
  readonly query?: string;
  readonly kind?: ExtensionKind;
  readonly category?: Category;
  readonly status?: Verification["status"];
}
