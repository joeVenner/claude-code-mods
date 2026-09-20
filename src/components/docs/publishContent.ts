import { CATEGORIES, EXTENSION_KINDS, publisherSchema } from "@/lib/types";
import type { Extension } from "@/lib/types";

export interface EntryFieldDoc {
  readonly type: string;
  readonly description: string;
}

/**
 * One row per catalog field. Typed as a full record over `keyof Extension`, so adding or removing
 * a schema field fails the type check here until this documentation is updated.
 */
export const ENTRY_FIELD_DOCS: Readonly<Record<keyof Extension, EntryFieldDoc>> = {
  slug: {
    type: "string",
    description: "Lowercase words joined by hyphens. It becomes the entry's address, /extensions/<slug>/.",
  },
  name: { type: "string", description: "Display name shown in lists and on the entry page." },
  kind: { type: EXTENSION_KINDS.join(" | "), description: "What sort of extension this is." },
  categories: {
    type: `array of ${CATEGORIES.join(" | ")}`,
    description: "At least one. Drives the category filter and related entries.",
  },
  summary: { type: "string", description: "One line, 160 characters at most, shown on cards and in search." },
  description: { type: "array of string", description: "At least one paragraph. Each item renders as its own paragraph." },
  publisher: {
    type: `{ name, url, kind: ${publisherSchema.shape.kind.options.join(" | ")} }`,
    description: "Who publishes it. The url is an https address on an allowed host or null, and only non-null urls become links.",
  },
  repositoryUrl: {
    type: "https URL | null",
    description:
      "Public source repository on github.com or code.claude.com, with no credentials in the URL. Required for verified entries and must be null for concepts.",
  },
  license: { type: "string | null", description: "License identifier as stated by the source, or null if none is stated." },
  installCommands: {
    type: "array of string",
    description: "Commands a user can run, copied as written. Must be empty for concepts.",
  },
  hooks: { type: "array of string", description: "Claude Code lifecycle events the entry uses, when applicable." },
  tags: { type: "array of string", description: "Free-form keywords used by search." },
  links: {
    type: "array of { label, url }",
    description: "Extra https links such as a README or documentation page, on github.com or code.claude.com.",
  },
  stars: {
    type: "{ count, capturedAt } | null",
    description: "GitHub stars with the date they were captured. Must be null for concepts.",
  },
  isFeatured: { type: "boolean", description: "Places the entry at the front of the catalog order." },
  verification: {
    type: "verified { checkedAt, sourceUrl } | concept { specReference }",
    description:
      "How far the entry's claims can be trusted. Verified records the date the source URL responded. Concept records where the spec describes it.",
  },
};

export interface EntryFieldGroup {
  readonly title: string;
  readonly fields: readonly (keyof Extension)[];
}

export const ENTRY_FIELD_GROUPS: readonly EntryFieldGroup[] = [
  { title: "Identity", fields: ["slug", "name", "kind", "categories", "summary", "description"] },
  { title: "Source and trust", fields: ["publisher", "repositoryUrl", "license", "verification", "stars"] },
  { title: "Usage and display", fields: ["installCommands", "hooks", "links", "tags", "isFeatured"] },
];

/**
 * Fictional entry for documentation only. The URLs sit on an allowed host so the example validates
 * against the real schema, but the publisher path is invented and `npm run catalog:verify` would report
 * it as not found, which is the point: this must never be mistaken for a listing.
 */
export const EXAMPLE_ENTRY: Extension = {
  slug: "example-hook-pack",
  name: "Example Hook Pack",
  kind: "hook",
  categories: ["quality"],
  summary: "Runs a formatter after each file edit and reports failures back to the session.",
  description: [
    "One paragraph per array item. Say what it does, what it needs, and anything a user should check first.",
  ],
  publisher: { name: "Example publisher", url: null, kind: "community" },
  repositoryUrl: "https://github.com/example-publisher/example-hook-pack",
  license: "MIT",
  installCommands: ["/plugin install example-hook-pack@example-marketplace"],
  hooks: ["PostToolUse"],
  tags: ["formatting"],
  links: [{ label: "README", url: "https://github.com/example-publisher/example-hook-pack/blob/main/README.md" }],
  stars: null,
  isFeatured: false,
  verification: {
    status: "verified",
    checkedAt: "2026-01-15",
    sourceUrl: "https://github.com/example-publisher/example-hook-pack",
  },
};

export const EXAMPLE_ENTRY_JSON: string = JSON.stringify(EXAMPLE_ENTRY, null, 2);

/** Proposed API from the marketplace architecture report (04). None of it exists. */
export const PROPOSED_PUBLISH_API = [
  { id: "endpoint", term: "Endpoint", value: "POST /v1/mods/publish" },
  { id: "auth", term: "Headers", value: "Authorization: Bearer <publish-token> and X-Signature-Ed25519: <signature>" },
  { id: "body", term: "Body", value: "multipart/form-data with the package tarball (.tgz)" },
  {
    id: "response",
    term: "Response",
    value: "201 Created with a status of queued_for_security_scan, the mod id, the version and a scan job id",
  },
] as const;

export const PLUGIN_DOCS_LINKS = [
  { label: "Claude Code plugins", url: "https://code.claude.com/docs/en/plugins" },
  { label: "Plugin marketplaces", url: "https://code.claude.com/docs/en/plugin-marketplaces" },
] as const;
