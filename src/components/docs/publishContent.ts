import { AVAILABILITIES, CATEGORIES, EXTENSION_KINDS, publisherSchema } from "@/lib/types";
import type { Extension, GuideSection } from "@/lib/types";
import type { TimelineItem } from "./Timeline";

export interface EntryFieldDoc {
  readonly type: string;
  readonly description: string;
  /** What a community submission must do with this field, when the rule is stricter than the schema. */
  readonly submissionRule?: string;
}

/**
 * One row per catalog field. Typed as a full record over `keyof Extension`, so adding or removing
 * a schema field fails the type check here until this documentation is updated.
 */
export const ENTRY_FIELD_DOCS: Readonly<Record<keyof Extension, EntryFieldDoc>> = {
  slug: {
    type: "string",
    description: "Lowercase words joined by hyphens. It becomes the entry's address, /extensions/<slug>/.",
    submissionRule:
      "The file name is the slug plus .json. A slug already in use, or too similar to one in use, is rejected.",
  },
  name: { type: "string", description: "Display name shown in lists and on the entry page." },
  kind: { type: EXTENSION_KINDS.join(" | "), description: "What sort of extension this is." },
  categories: {
    type: `array of ${CATEGORIES.join(" | ")}`,
    description: "At least one. Drives the category filter and related entries.",
  },
  summary: { type: "string", description: "One line, 160 characters at most, shown on cards and in search." },
  description: {
    type: "array of string",
    description: "At least one paragraph. Each item renders as its own paragraph.",
  },
  publisher: {
    type: `{ name, url, kind: ${publisherSchema.shape.kind.options.join(" | ")} }`,
    description:
      "Who publishes it. The url is an https address on an allowed host or null, and only non-null urls become links.",
    submissionRule:
      'kind must be "community". The name may not contain anthropic, claude, official or mcp. The url, the verification sourceUrl and the repositoryUrl share one github.com owner, and that owner cannot be a reserved one.',
  },
  repositoryUrl: {
    type: "https URL",
    description:
      "Public source location, with no credentials in the URL. It may point at a folder inside a repository, for example a /tree/main/<folder> address.",
    submissionRule: "Must be on github.com and respond with HTTP 200.",
  },
  license: {
    type: "string | null",
    description: "License as the source states it, or null if it states none. Do not guess one.",
  },
  availability: {
    type: AVAILABILITIES.join(" | "),
    description:
      "How a person gets it. installable has documented install commands. source-only has public source and no documented install command. built-in is for things that ship inside Claude Code.",
    submissionRule: "installable or source-only. built-in is reserved for maintainers.",
  },
  installCommands: {
    type: "array of string",
    description:
      "Commands a user can run, copied as written from the source. At least one when availability is installable, and empty otherwise.",
    submissionRule:
      "Each command is one line of printable ASCII, at most 200 characters, in one of the allowed forms listed under the rules. Anything else is written as prose.",
  },
  notice: {
    type: "string | null",
    description:
      "A caveat a reader must see before using the entry, such as early access or a required setting. Null when there is none.",
  },
  details: {
    type: "array of { label, value, isCommand }",
    description:
      "Extra labelled facts, such as the version or how to run it from source. Set isCommand to true when the value is something to run, and the page shows it as a copyable command.",
    submissionRule: "A value with isCommand true follows the same command rules as installCommands.",
  },
  guide: {
    type: "array of { title, paragraphs, commands }",
    description:
      "Long-form explanation in reading order, as titled sections. Each section has at least one paragraph and an optional list of commands.",
    submissionRule:
      'Required for a mod, with a section whose title contains "set up" or "setup" and one whose title contains "download". Start with an overview. Optional for other kinds. Guide commands follow the same command rules as installCommands.',
  },
  hooks: {
    type: "array of string",
    description: "Events the entry hooks, as its own source names them. A mod must list at least one.",
  },
  tags: { type: "array of string", description: "Free-form keywords used by search." },
  links: {
    type: "array of { label, url }",
    description: "Extra https links such as a README or documentation page, on github.com or code.claude.com.",
  },
  stars: {
    type: "{ count, capturedAt } | null",
    description: "GitHub stars with the date they were captured.",
    submissionRule: "Must be null. Maintainers capture star counts.",
  },
  isFeatured: {
    type: "boolean",
    description: "Places the entry at the front of the catalog order.",
    submissionRule: "Must be false. Only maintainers feature entries.",
  },
  verification: {
    type: "{ status: verified, checkedAt, sourceUrl }",
    description:
      "Records the date the source URL responded with HTTP 200. It says the source exists, not that anyone reviewed it.",
    submissionRule: "checkedAt cannot be a date in the future.",
  },
};

export interface EntryFieldGroup {
  readonly title: string;
  readonly fields: readonly (keyof Extension)[];
}

export const ENTRY_FIELD_GROUPS: readonly EntryFieldGroup[] = [
  { title: "Identity", fields: ["slug", "name", "kind", "categories", "summary", "description"] },
  { title: "Source and trust", fields: ["publisher", "repositoryUrl", "license", "verification", "stars"] },
  {
    title: "Usage and display",
    fields: ["availability", "installCommands", "notice", "details", "guide", "hooks", "links", "tags", "isFeatured"],
  },
];

export interface SubmissionRule {
  readonly id: string;
  readonly rule: string;
}

/**
 * Says what CI is and is not. A pull request runs its own copy of the checks, so they help
 * contributors and are not a security boundary; the paragraphs are shared with CONTRIBUTING.md.
 */
export const RULES_FRAMING: readonly string[] = [
  "CI checks the shape of an entry, that its URLs respond and that its manifest files exist. It cannot prove that a command or a package is safe, and a pull request runs its own copy of the checks, so they are a convenience for contributors and not a security boundary.",
  "A maintainer reads every submission before merging, and reads the text of the entry, not the code it points to. Merged means listed. It never means reviewed or endorsed.",
];

/** The rules every submission must meet, as enforced by the schema, the catalog loader and the CI checks. */
export const SUBMISSION_RULES: readonly SubmissionRule[] = [
  { id: "publisher-kind", rule: 'publisher.kind is "community".' },
  { id: "featured", rule: "isFeatured is false. Only maintainers feature entries." },
  { id: "stars", rule: "stars is null. Only maintainers record star counts." },
  {
    id: "repository",
    rule: "repositoryUrl is on github.com and responds with HTTP 200 when the check runs.",
  },
  { id: "availability", rule: "availability is installable or source-only, never built-in." },
  {
    id: "manifest",
    rule: "A plugin or a mod has .claude-plugin/plugin.json at the repositoryUrl location. A mod also has hooks/hooks.json with a modules array.",
  },
  {
    id: "mod-guide",
    rule: 'A mod lists at least one hooked event and includes a guide with a set up section and a download section, and each title contains "set up" (or "setup") and "download".',
  },
  {
    id: "commands",
    rule: "Every command, in installCommands, in details with isCommand true and in guide commands, is one line of printable ASCII, at most 200 characters, and has one of these forms: /plugin marketplace add <owner>/<repo>, /plugin install <name>@<marketplace>, claude --plugin-dir <path>, or git clone https://github.com/<owner>/<repo> for your own repository.",
  },
  {
    id: "download-commands",
    rule: "A download section that starts with that git clone may also use cd and git sparse-checkout set.",
  },
  {
    id: "no-other-commands",
    rule: "npx, curl, pipes and every other command are written as prose, never as a command.",
  },
  {
    id: "characters",
    rule: "No control, bidirectional or zero-width characters anywhere in the entry.",
  },
  {
    id: "publisher-name",
    rule: "The publisher name does not contain anthropic, claude, official or mcp.",
  },
  {
    id: "owner",
    rule: "The publisher url, the verification sourceUrl and the repositoryUrl share one github.com owner, and that owner is not a reserved one.",
  },
  { id: "checked-at", rule: "verification.checkedAt is not a date in the future." },
  { id: "similar-slug", rule: "The slug is not too similar to a slug already in the directory." },
  {
    id: "hosts",
    rule: "Every URL is https on an allowlisted host (github.com or code.claude.com), with no credentials and no custom port.",
  },
  { id: "file-name", rule: "One entry per file, and the file name is the slug plus .json." },
];

/** Not a rule: what readers see for an entry a community member submitted. */
export const COMMUNITY_LABEL = "Community listing";

/** Open item, not a decision. The repository has no LICENSE file, and the maintainer has not chosen one. */
export const LICENSE_OPEN_ITEM =
  "This repository has no LICENSE file yet. The maintainer will decide the license that applies to submitted data. Until that is decided, do not assume one.";

/** Shown on the publish page and repeated in CONTRIBUTING.md; a test keeps the two in step. */
export const COMMUNITY_FILE_PATTERN = "src/data/community/<slug>.json";

export const CLONE_COMMANDS: readonly string[] = [
  "git clone https://github.com/<your-account>/claude-code-mods.git",
  "cd claude-code-mods",
  "git switch -c add-<slug>",
  "npm ci",
];

export const CHECK_COMMANDS: readonly string[] = [
  "npm test",
  `npm run catalog:verify -- --only ${COMMUNITY_FILE_PATTERN}`,
  `npm run catalog:structure -- --only ${COMMUNITY_FILE_PATTERN}`,
];

/** Plain verbs, in order. Titles name the action instead of numbering it. */
export const PUBLISH_STEPS: readonly TimelineItem[] = [
  {
    title: "Fork and clone the repository",
    description:
      "Fork the public repository on GitHub, clone your fork and start a branch. Node 22 or newer is required.",
    commands: CLONE_COMMANDS,
  },
  {
    title: "Add one file",
    description: `Create ${COMMUNITY_FILE_PATTERN}. It holds a single entry, as a JSON object, and its name is the slug plus .json. Change nothing else, so that two submissions never conflict. A pull request that changes files there and files elsewhere fails a path check.`,
  },
  {
    title: "Run the checks locally",
    description:
      "The first command runs the unit tests, which load every data file against the schema. The other two check your file against the network and are the same checks CI runs.",
    commands: CHECK_COMMANDS,
  },
  {
    title: "Open a pull request",
    description:
      "Push the branch to your fork and open a pull request against main. The template asks you to confirm each rule on this page.",
  },
  {
    title: "Wait for CI",
    description:
      "A workflow installs the project, runs typecheck, lint, tests and a build, then runs the two catalog checks on the file you added. A failing check names the field or the URL.",
  },
  {
    title: "A maintainer reviews and merges",
    description:
      "A maintainer reads every submission before merging: that its text matches the source's own words, that the links work and that the rules are met. Maintainers read the text, not the code the entry points to.",
  },
  {
    title: "The site rebuilds",
    description:
      "After the merge the site is built again from main. It reads the new file and the entry appears in the directory.",
  },
];

/**
 * Fictional entry for documentation only. The URLs sit on an allowed host so the example validates
 * against the real schema, but the publisher and repository are invented and the link check would
 * report them as not found, which is the point: this must never be mistaken for a listing.
 */
export const EXAMPLE_ENTRY: Extension = {
  slug: "example-format-on-save",
  name: "Example Format on Save",
  kind: "plugin",
  categories: ["quality"],
  summary: "Runs a formatter after each file edit and reports failures back to the session.",
  description: [
    "One paragraph per array item. Say what it does, what it needs, and anything a user should check first.",
  ],
  publisher: { name: "Example publisher", url: "https://github.com/example-publisher", kind: "community" },
  repositoryUrl: "https://github.com/example-publisher/example-format-on-save",
  license: "MIT",
  availability: "source-only",
  installCommands: [],
  notice: null,
  details: [{ label: "Formatter", value: "Any formatter on your PATH", isCommand: false }],
  guide: [],
  hooks: ["PostToolUse"],
  tags: ["formatting"],
  links: [
    { label: "README", url: "https://github.com/example-publisher/example-format-on-save/blob/main/README.md" },
  ],
  stars: null,
  isFeatured: false,
  verification: {
    status: "verified",
    checkedAt: "2026-01-15",
    sourceUrl: "https://github.com/example-publisher/example-format-on-save",
  },
};

export const EXAMPLE_ENTRY_JSON: string = JSON.stringify(EXAMPLE_ENTRY, null, 2);

/**
 * The shape of a guide, for a fictional mod. A mod submission needs at least these three sections;
 * the wording is invented and belongs to no real mod.
 */
export const EXAMPLE_GUIDE: readonly GuideSection[] = [
  {
    title: "Overview",
    paragraphs: ["What the mod does, which events it hooks and what a person will notice when it is loaded."],
    commands: [],
  },
  {
    title: "Setup",
    paragraphs: ["What has to be enabled first, and how to load the mod from a local folder."],
    commands: ["claude --plugin-dir example-hook-mod"],
  },
  {
    title: "Download",
    paragraphs: ["Where the source lives and how to get it."],
    commands: ["git clone https://github.com/example-publisher/example-hook-mod"],
  },
];

export const EXAMPLE_GUIDE_JSON: string = JSON.stringify(EXAMPLE_GUIDE, null, 2);

/** How the four mods that ship in Claude Code are loaded, per the mods README. */
export const MODS_LOADING_COMMANDS: readonly string[] = [
  "claude --plugin-dir <path-to-mod>",
  "claude plugin test <path-to-mod>",
];

export const MODS_TYPES_URL = "https://github.com/anthropics/claude-code/tree/main/mods/types";
export const MODS_README_URL = "https://github.com/anthropics/claude-code/blob/main/mods/README.md";

export const PLUGIN_DOCS_LINKS = [
  { label: "Claude Code plugins", url: "https://code.claude.com/docs/en/plugins" },
  { label: "Plugin marketplaces", url: "https://code.claude.com/docs/en/plugin-marketplaces" },
] as const;
