import { eventAnchorId, eventSourceUrl, hookSelectsEvent, isWildcardHook, nounOf, patternMatchesEvent } from "@/lib/event-names";
import {
  EVENT_FAMILIES,
  type EventFamily,
  type EventsFile,
  type Extension,
  type ExtensionKind,
  type HookEvent,
  type Publisher,
} from "@/lib/types";

/**
 * The Hooks page's reference: every event from `events.json`, each with the directory entries that
 * list it and a link to the line that declares it. Pure and serialisable, so the client explorer can
 * take it as props. Nothing here says what an event does: the catalog does not record that.
 */

export interface EventUser {
  readonly slug: string;
  readonly name: string;
  readonly kind: ExtensionKind;
  readonly publisherKind: Publisher["kind"];
  /** The hook name as the entry's own source writes it. It differs from the event for a wildcard or a bare classic name. */
  readonly via: string;
}

export interface EventReferenceRow {
  readonly name: string;
  readonly family: EventFamily;
  readonly noun: string;
  readonly anchorId: string;
  /** Link to the declaring line in Anthropic's declarations, pinned to a commit. */
  readonly sourceUrl: string;
  readonly line: number;
  /** Entries that list this event, sorted by name. */
  readonly users: readonly EventUser[];
}

/** A hook name that selects no event in the reference, for example a noun that only a plugin declares. */
export interface OtherHookName {
  readonly name: string;
  readonly entries: readonly EventUser[];
}

export interface EventReference {
  readonly rows: readonly EventReferenceRow[];
  readonly otherNames: readonly OtherHookName[];
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  return left > right ? 1 : 0;
}

/** Entries that name an event themselves come before entries that reach it through a wildcard. */
function compareUsers(left: EventUser, right: EventUser): number {
  const wildcardRank = Number(isWildcardHook(left.via)) - Number(isWildcardHook(right.via));
  return wildcardRank || compareText(left.name, right.name) || compareText(left.slug, right.slug);
}

/** Only entries that are not mods may write a classic event bare: a mod names events as function hooks do. */
function allowsBareClassic(extension: Extension): boolean {
  return extension.kind !== "mod";
}

/** The hook of `extension` that selects `event`, preferring one that names it over a wildcard. */
function hookReaching(extension: Extension, event: HookEvent): string | undefined {
  const allowBareClassic = allowsBareClassic(extension);
  const selecting = extension.hooks.filter((hook) => hookSelectsEvent(hook, event, allowBareClassic));
  return selecting.find((hook) => !isWildcardHook(hook)) ?? selecting[0];
}

function toUser(extension: Extension, via: string): EventUser {
  return { slug: extension.slug, name: extension.name, kind: extension.kind, publisherKind: extension.publisher.kind, via };
}

/**
 * Builds the reference. An entry counts once per event, under the hook that names it, or else the
 * first wildcard that selects it. Entries that name an event come before entries that reach it through
 * a wildcard. Rows keep the order of `events`, which the events file sorts by name.
 */
export function buildEventReference(
  source: EventsFile["source"],
  events: readonly HookEvent[],
  extensions: readonly Extension[],
): EventReference {
  const rows = events.map((event): EventReferenceRow => {
    const users = extensions.flatMap((extension) => {
      const via = hookReaching(extension, event);
      return via === undefined ? [] : [toUser(extension, via)];
    });
    return {
      name: event.name,
      family: event.family,
      noun: nounOf(event),
      anchorId: eventAnchorId(event.name),
      sourceUrl: eventSourceUrl(source, event),
      line: event.line,
      users: users.sort(compareUsers),
    };
  });

  const entriesByOtherName = new Map<string, EventUser[]>();
  for (const extension of extensions) {
    for (const hook of new Set(extension.hooks)) {
      if (patternMatchesEvent(hook, events, allowsBareClassic(extension))) continue;
      const entries = entriesByOtherName.get(hook) ?? [];
      entries.push(toUser(extension, hook));
      entriesByOtherName.set(hook, entries);
    }
  }
  const otherNames = [...entriesByOtherName]
    .map(([name, entries]) => ({ name, entries: entries.sort(compareUsers) }))
    .sort((left, right) => compareText(left.name, right.name));

  return { rows, otherNames };
}

export interface EventFilter {
  readonly query: string;
  readonly family: EventFamily | "all";
}

/**
 * Rows that match `filter`: the family, and a case-insensitive substring of the event name (which
 * begins with its noun) or of the name of an entry that uses it. A blank query matches every row.
 */
export function filterEventRows(rows: readonly EventReferenceRow[], filter: EventFilter): readonly EventReferenceRow[] {
  const query = filter.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter.family !== "all" && row.family !== filter.family) return false;
    if (query === "") return true;
    return row.name.toLowerCase().includes(query) || row.users.some((user) => user.name.toLowerCase().includes(query));
  });
}

export interface EventNounGroup {
  readonly noun: string;
  readonly rows: readonly EventReferenceRow[];
}

export interface EventFamilyGroup {
  readonly family: EventFamily;
  readonly nouns: readonly EventNounGroup[];
  readonly count: number;
}

/** Groups rows by family, in the fixed family order, then by noun, keeping the order of `rows`. Empty groups are left out. */
export function groupEventRows(rows: readonly EventReferenceRow[]): readonly EventFamilyGroup[] {
  return EVENT_FAMILIES.flatMap((family) => {
    const familyRows = rows.filter((row) => row.family === family);
    if (familyRows.length === 0) return [];
    const nouns = [...new Set(familyRows.map((row) => row.noun))].map((noun) => ({
      noun,
      rows: familyRows.filter((row) => row.noun === noun),
    }));
    return [{ family, nouns, count: familyRows.length }];
  });
}
