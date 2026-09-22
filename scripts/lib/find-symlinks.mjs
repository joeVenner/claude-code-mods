// A walk that lists symbolic links under a folder. Used by scripts/typecheck-templates.mjs, because
// TypeScript follows a link into any file it points at and quotes lines of it in its diagnostics.
// No network here, so vitest can import this file (src/lib/find-symlinks.test.ts).

import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Paths, relative to `directory` and with forward slashes, of every symbolic link at any depth.
 * A link is reported and never followed, so a link to a folder is not walked into.
 * @param {string} directory
 * @returns {Promise<string[]>} sorted; empty when there are none
 * @throws Error when `directory` cannot be read
 */
export async function findSymbolicLinks(directory) {
  const found = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isSymbolicLink()) found.push(path.relative(directory, entryPath).split(path.sep).join("/"));
      else if (entry.isDirectory()) await walk(entryPath);
    }
  }
  await walk(directory);
  return found.sort();
}
