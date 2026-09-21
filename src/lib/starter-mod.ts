import { lstatSync, readFileSync, realpathSync, type Stats } from "node:fs";
import path from "node:path";
import { describeError } from "@/lib/data-files";

/**
 * The starter mod in `templates/mod-starter/`, read from disk so the Getting started page shows the
 * files that `claude plugin test` ran, never a copy that could drift from them.
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
 * Each file must be a regular file whose real path is exactly where it is listed. A symlink, in the
 * file or in any folder above it, is refused: the build renders these files as public text, so a
 * pull request that swapped one for a link to another file on the build machine would publish it.
 * @throws Error naming the file when one cannot be read or is not a regular file inside the folder.
 */
export function loadStarterModFiles(rootDirectory: string = process.cwd()): readonly StarterModFile[] {
  return STARTER_MOD_FILES.map((relativePath) => ({ path: relativePath, content: readStarterModFile(rootDirectory, relativePath) }));
}

function readStarterModFile(rootDirectory: string, relativePath: string): string {
  const label = `${STARTER_MOD_DIRECTORY}/${relativePath}`;
  const filePath = path.join(rootDirectory, STARTER_MOD_DIRECTORY, relativePath);
  let realPath: string;
  let stats: Stats;
  try {
    realPath = realpathSync(filePath);
    stats = lstatSync(filePath);
  } catch (error) {
    throw new Error(`${label}: cannot read file (${describeError(error)})`, { cause: error });
  }
  const expectedPath = path.join(realpathSync(rootDirectory), STARTER_MOD_DIRECTORY, relativePath);
  if (realPath !== expectedPath || !stats.isFile()) throw new Error(`${label}: not a regular file inside the starter mod folder`);
  try {
    return readFileSync(filePath, "utf8").replace(/\n$/, "");
  } catch (error) {
    throw new Error(`${label}: cannot read file (${describeError(error)})`, { cause: error });
  }
}
