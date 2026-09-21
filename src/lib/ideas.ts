import path from "node:path";
import { defaultDataDirectory, displayPath, formatIssues, readJsonFile } from "@/lib/data-files";
import { ideasFileSchema, type Idea, type IdeasFile } from "@/lib/types";

/**
 * Ideas are proposals from the marketplace spec with no public implementation. They live in
 * `src/data/ideas.json`, never in the directory, its counts or its search.
 * Server code only: this module reads the file system.
 */

export const IDEAS_FILE_NAME = "ideas.json";

/**
 * Reads and validates the ideas file inside `dataDirectory`.
 * @throws Error naming the file and listing every zod issue with its path.
 */
export function loadIdeasFile(dataDirectory: string): IdeasFile {
  const filePath = path.join(dataDirectory, IDEAS_FILE_NAME);
  const result = ideasFileSchema.safeParse(readJsonFile(filePath));
  if (!result.success) {
    throw new Error(`Invalid ${displayPath(filePath)}:\n${formatIssues(result.error.issues)}`);
  }
  return result.data;
}

/** The ideas in `dataDirectory`, in file order. */
export function loadIdeas(dataDirectory: string): readonly Idea[] {
  return loadIdeasFile(dataDirectory).ideas;
}

let cachedIdeasFile: IdeasFile | undefined;

function getIdeasFile(): IdeasFile {
  cachedIdeasFile ??= loadIdeasFile(defaultDataDirectory());
  return cachedIdeasFile;
}

/** Ideas in the order the file lists them. */
export function getIdeas(): readonly Idea[] {
  return getIdeasFile().ideas;
}

/** Date (YYYY-MM-DD) the spec reports were last read for the ideas list. */
export function getIdeasCheckedAt(): string {
  return getIdeasFile().checkedAt;
}
