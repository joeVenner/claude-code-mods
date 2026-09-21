import path from "node:path";
import { defaultDataDirectory, displayPath, formatIssues, readJsonFile } from "@/lib/data-files";
import { eventsFileSchema, type EventsFile, type HookEvent } from "@/lib/types";

/**
 * The hook events of Claude Code's function hooks, in `src/data/events.json`. The file is written
 * by `scripts/sync-events.mjs` from Anthropic's type declarations and holds names only.
 * Server code only: this module reads the file system.
 */

export const EVENTS_FILE_NAME = "events.json";

/**
 * Reads and validates the events file inside `dataDirectory`.
 * @throws Error naming the file and listing every zod issue with its path.
 */
export function loadEventsFile(dataDirectory: string): EventsFile {
  const filePath = path.join(dataDirectory, EVENTS_FILE_NAME);
  const result = eventsFileSchema.safeParse(readJsonFile(filePath));
  if (!result.success) {
    throw new Error(`Invalid ${displayPath(filePath)}:\n${formatIssues(result.error.issues)}`);
  }
  return result.data;
}

let cachedEventsFile: EventsFile | undefined;

function getEventsFile(): EventsFile {
  cachedEventsFile ??= loadEventsFile(defaultDataDirectory());
  return cachedEventsFile;
}

/** Every event, sorted by name. */
export function getEvents(): readonly HookEvent[] {
  return getEventsFile().events;
}

/** The upstream commit, Claude Code version and sync date the names were read from. */
export function getEventsSource(): EventsFile["source"] {
  return getEventsFile().source;
}

// Pure helpers live in event-names.ts so client components can import them; re-exported for callers of this module.
export { eventSourceUrl, nounOf, patternMatchesEvent } from "@/lib/event-names";
