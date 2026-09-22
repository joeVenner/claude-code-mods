import { readTemplateFile } from "@/lib/template-files";

/**
 * The starter mod in `templates/mod-starter/`, read from disk so the Getting started page shows the
 * files that `claude plugin test` ran, never a copy that could drift from them. The reading is
 * symlink-safe (see `template-files.ts`).
 * Server code only: this module reads the file system.
 */

export const STARTER_MOD_DIRECTORY = "templates/mod-starter";

/** Files the page shows, in reading order. A test fails when the folder holds a file that is not listed. */
export const STARTER_MOD_FILES = [
  ".claude-plugin/plugin.json",
  "hooks/hooks.json",
  "hooks/register.ts",
  "hooks/is-force-push.ts",
  "tests/register.test.ts",
  "tests/is-force-push.test.ts",
] as const;

export interface StarterModFile {
  /** Path inside the starter mod folder, with forward slashes. */
  readonly path: (typeof STARTER_MOD_FILES)[number];
  /** File text without its final newline. */
  readonly content: string;
}

/**
 * Reads every starter mod file under `rootDirectory` (the project root by default).
 * @throws Error naming the file when one cannot be read or is not a regular file in its place.
 */
export function loadStarterModFiles(rootDirectory: string = process.cwd()): readonly StarterModFile[] {
  return STARTER_MOD_FILES.map((relativePath) => ({
    path: relativePath,
    content: readTemplateFile(rootDirectory, STARTER_MOD_DIRECTORY, relativePath),
  }));
}
