import type { Extension } from "@/lib/types";

/** A compliant community mod: own repository, allowed command shapes, proper guide. Fictional owner. */
export const communityMod: Extension = {
  slug: "tidy-hooks",
  name: "tidy-hooks",
  kind: "mod",
  categories: ["workflow"],
  summary: "Runs a formatter after each edit.",
  description: ["Formats a file after Claude edits it."],
  publisher: { name: "Tidy Labs", url: "https://github.com/tidy-labs", kind: "community" },
  repositoryUrl: "https://github.com/tidy-labs/tidy-hooks",
  license: "MIT",
  availability: "source-only",
  installCommands: [],
  notice: null,
  details: [
    { label: "Version", value: "0.2.0", isCommand: false },
    { label: "Run from source", value: "claude --plugin-dir mods/tidy-hooks", isCommand: true },
  ],
  guide: [
    { title: "What it does", paragraphs: ["Formats a file after an edit."], commands: [] },
    { title: "Set up", paragraphs: ["Load it from a clone."], commands: ["claude --plugin-dir mods/tidy-hooks"] },
    {
      title: "Download the source",
      paragraphs: ["Clone the repository. Its license is stated in the repository."],
      commands: [
        "git clone --depth 1 https://github.com/tidy-labs/tidy-hooks.git",
        "cd tidy-hooks",
        "git sparse-checkout set mods/tidy-hooks",
      ],
    },
  ],
  hooks: ["tool.call"],
  tags: ["format"],
  links: [{ label: "README", url: "https://github.com/tidy-labs/tidy-hooks" }],
  stars: null,
  isFeatured: false,
  verification: {
    status: "verified",
    checkedAt: "2026-09-20",
    sourceUrl: "https://github.com/tidy-labs/tidy-hooks",
  },
};
