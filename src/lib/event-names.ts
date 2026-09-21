import type { EventsFile, HookEvent } from "@/lib/types";

/**
 * Pure helpers over event names, with no file system access, so client components can import them.
 * `events.ts` reads the events file and re-exports these.
 */

/** The noun an event belongs to: the part of its name before the dot (`fs` for `fs.write`). */
export function nounOf(event: HookEvent): string {
  const dotIndex = event.name.indexOf(".");
  return dotIndex === -1 ? event.name : event.name.slice(0, dotIndex);
}

/** Where `event` is declared, as a github.com link pinned to the synced commit. */
export function eventSourceUrl(source: EventsFile["source"], event: HookEvent): string {
  return `https://github.com/${source.repository}/blob/${source.sha}/${source.path}#L${event.line}`;
}

/** The id of an event's row on the Hooks page, so any page can link to it. */
export function eventAnchorId(eventName: string): string {
  return `event-${eventName}`;
}

/** True for `*` and a namespace wildcard such as `tool.*`: a hook that selects many events, not one. */
export function isWildcardHook(hook: string): boolean {
  return hook === "*" || hook.endsWith(".*");
}

/**
 * True when `hook`, a hook name as an entry's own source writes it, selects `event`: the exact name,
 * `*`, or a namespace wildcard such as `tool.*` or `classic.*`.
 *
 * `allowBareClassic` also accepts a classic event written bare (`PreToolUse` for `classic.PreToolUse`),
 * which is how classic hook plugins name it. A mod names events the way function hooks do, so for a
 * mod a bare name is a mistake and is left unmatched. The schema ties the `classic.` prefix to the
 * classic family, so the name alone decides.
 */
export function hookSelectsEvent(hook: string, event: Pick<HookEvent, "name">, allowBareClassic: boolean): boolean {
  if (hook === "*") return true;
  if (hook.endsWith(".*")) return event.name.startsWith(hook.slice(0, -1));
  if (hook === event.name) return true;
  // A classic event's own name has no dot after `classic.`, so neither does a bare one.
  return allowBareClassic && !hook.includes(".") && event.name === `classic.${hook}`;
}

/**
 * True when `pattern` selects at least one of `events`. Patterns over a noun that only a plugin
 * declares (`telemetry.*`) select none. Bare classic names are not accepted unless `allowBareClassic`.
 */
export function patternMatchesEvent(
  pattern: string,
  events: readonly Pick<HookEvent, "name">[],
  allowBareClassic = false,
): boolean {
  return events.some((event) => hookSelectsEvent(pattern, event, allowBareClassic));
}

/**
 * The one event a hook names directly, or null for a wildcard or a name that is not an event. Only
 * these hooks can link to a single row of the Hooks page; a wildcard stays text.
 */
export function eventNamedBy<Event extends Pick<HookEvent, "name">>(
  hook: string,
  events: readonly Event[],
  allowBareClassic: boolean,
): Event | null {
  if (isWildcardHook(hook)) return null;
  return events.find((event) => hookSelectsEvent(hook, event, allowBareClassic)) ?? null;
}

/**
 * For each hook that names exactly one event, a link to that event's row on the Hooks page, keyed by
 * the hook as the entry writes it. Wildcards and names that are not events get no link.
 *
 * A Map, not an object: hook names come from community entries, and an object would answer a lookup
 * of `constructor` or `__proto__` with something inherited instead of nothing.
 */
export function hookEventHrefs(
  hooks: readonly string[],
  events: readonly Pick<HookEvent, "name">[],
  hooksPagePath: string,
  allowBareClassic: boolean,
): ReadonlyMap<string, string> {
  const links = new Map<string, string>();
  for (const hook of hooks) {
    const event = eventNamedBy(hook, events, allowBareClassic);
    if (event !== null) links.set(hook, `${hooksPagePath}#${eventAnchorId(event.name)}`);
  }
  return links;
}
