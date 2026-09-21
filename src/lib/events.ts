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

/** The noun an event belongs to: the part of its name before the dot (`fs` for `fs.write`). */
export function nounOf(event: HookEvent): string {
  const dotIndex = event.name.indexOf(".");
  return dotIndex === -1 ? event.name : event.name.slice(0, dotIndex);
}

/** Where `event` is declared, as a github.com link pinned to the synced commit. */
export function eventSourceUrl(source: EventsFile["source"], event: HookEvent): string {
  return `https://github.com/${source.repository}/blob/${source.sha}/${source.path}#L${event.line}`;
}

/**
 * True when `pattern`, a hook name as a mod's own source writes it, selects at least one known
 * event: an exact name, `*`, `<noun>.*`, or `classic.*`. Patterns naming a noun that a plugin
 * declares for itself (`telemetry.*`) select nothing here, so they return false.
 */
export function patternMatchesEvent(pattern: string, events: readonly HookEvent[]): boolean {
  if (pattern === "*") return events.length > 0;
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -1);
    return events.some((event) => event.name.startsWith(prefix));
  }
  return events.some((event) => event.name === pattern);
}
