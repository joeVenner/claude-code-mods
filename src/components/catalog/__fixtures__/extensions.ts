import { extensionSchema } from "@/lib/types";
import type { Extension } from "@/lib/types";

/**
 * Typed test fixtures, parsed through the real schema so they break loudly if the contract
 * changes. Names are invented for tests and do not describe real catalog entries.
 */
export const verifiedExtension: Extension = extensionSchema.parse({
  slug: "fixture-lint-runner",
  name: "Fixture Lint Runner",
  kind: "plugin",
  categories: ["quality", "development", "workflow"],
  summary: "Runs the project linter after each edit and reports failures back to the session.",
  description: ["Fixture description paragraph."],
  publisher: { name: "Fixture Publisher", url: null, kind: "community" },
  repositoryUrl: "https://github.com/fixture-org/fixture-lint-runner",
  license: "MIT",
  availability: "installable",
  installCommands: ["/plugin install fixture-lint-runner"],
  notice: null,
  details: [],
  hooks: ["PostToolUse"],
  tags: ["lint"],
  links: [],
  stars: { count: 1234, capturedAt: "2026-05-01" },
  isFeatured: false,
  verification: {
    status: "verified",
    checkedAt: "2026-05-02",
    sourceUrl: "https://github.com/fixture-org/fixture-lint-runner",
  },
});

/** A built-in mod: no install commands, a notice, run-from-source details and dotted events. */
export const builtInModExtension: Extension = extensionSchema.parse({
  slug: "fixture-pane-mod",
  name: "fixture-pane-mod",
  kind: "mod",
  categories: ["development", "workflow"],
  summary: "Fixture mod that opens a pane beside the transcript.",
  description: ["Fixture mod paragraph one.", "Fixture mod paragraph two."],
  publisher: { name: "Fixture Vendor", url: "https://github.com/fixture-vendor", kind: "anthropic" },
  repositoryUrl: "https://github.com/fixture-vendor/fixture-repo/tree/main/mods/fixture-pane-mod",
  license: "All rights reserved. Fixture license text.",
  availability: "built-in",
  installCommands: [],
  notice: "Early access. Fixture notice about function hooks and a changing API.",
  details: [
    { label: "Seated", value: "Built in", isCommand: false },
    { label: "Run from source", value: "claude --plugin-dir mods/fixture-pane-mod", isCommand: true },
    { label: "Test", value: "claude plugin test mods/fixture-pane-mod", isCommand: true },
  ],
  guide: [
    {
      title: "What it does",
      paragraphs: ["Fixture overview paragraph one.", "Fixture overview paragraph two."],
      commands: [],
    },
    {
      title: "Set up",
      paragraphs: ["Fixture setup paragraph."],
      commands: ["git clone https://github.com/fixture-vendor/fixture-repo.git", "cd fixture-repo"],
    },
    {
      title: "Download the source",
      paragraphs: ["Fixture download paragraph."],
      commands: ["git clone https://github.com/fixture-vendor/fixture-repo.git"],
    },
  ],
  hooks: ["session.start", "classic.*", "tool.call"],
  tags: ["pane", "built-in"],
  links: [],
  stars: null,
  isFeatured: true,
  verification: {
    status: "verified",
    checkedAt: "2026-05-02",
    sourceUrl: "https://github.com/fixture-vendor/fixture-repo/tree/main/mods/fixture-pane-mod",
  },
});

/** Public source with no documented install command. */
export const sourceOnlyExtension: Extension = extensionSchema.parse({
  slug: "fixture-source-only",
  name: "Fixture Source Only",
  kind: "skill",
  categories: ["development"],
  summary: "Fixture skill whose repository documents no install command.",
  description: ["Fixture source-only paragraph."],
  publisher: { name: "Fixture Publisher", url: null, kind: "community" },
  repositoryUrl: "https://github.com/fixture-org/fixture-source-only",
  license: null,
  availability: "source-only",
  installCommands: [],
  notice: null,
  details: [],
  hooks: [],
  tags: [],
  links: [],
  stars: null,
  isFeatured: false,
  verification: {
    status: "verified",
    checkedAt: "2026-05-02",
    sourceUrl: "https://github.com/fixture-org/fixture-source-only",
  },
});
