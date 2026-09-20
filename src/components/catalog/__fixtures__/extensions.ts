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
  installCommands: ["/plugin install fixture-lint-runner"],
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

export const conceptExtension: Extension = extensionSchema.parse({
  slug: "fixture-context-trimmer",
  name: "Fixture Context Trimmer",
  kind: "mod",
  categories: ["optimization"],
  summary: "Proposed design for trimming stale context before each prompt.",
  description: ["Fixture concept paragraph."],
  publisher: { name: "Marketplace spec", url: null, kind: "spec" },
  repositoryUrl: null,
  license: null,
  installCommands: [],
  hooks: [],
  tags: [],
  links: [],
  stars: null,
  isFeatured: false,
  verification: { status: "concept", specReference: "Fixture spec section" },
});
