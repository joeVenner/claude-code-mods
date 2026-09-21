import type { Extension, ExtensionKind, Publisher } from "@/lib/types";

/**
 * A cross-entry index of hook events: for each event name, which catalog entries list it.
 *
 * Function hooks belong to mods (Claude Code's early access hooks modules); every other kind that
 * lists hooks uses the classic lifecycle hooks. The split follows the kind of the entry that lists
 * an event, so no event name is hard-coded here and a new event in the catalog appears on its own.
 */

export interface HookEntryRef {
  readonly slug: string;
  readonly name: string;
  readonly kind: ExtensionKind;
  readonly publisherKind: Publisher["kind"];
}

export interface HookEventRow {
  /** The event name exactly as the entry's own source names it. */
  readonly event: string;
  /** Entries listing this event, sorted by name. */
  readonly entries: readonly HookEntryRef[];
}

export interface HooksIndex {
  /** Events listed by mods. */
  readonly functionHooks: readonly HookEventRow[];
  /** Events listed by every other kind. */
  readonly classicHooks: readonly HookEventRow[];
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  return left > right ? 1 : 0;
}

function toEntryRef(extension: Extension): HookEntryRef {
  return { slug: extension.slug, name: extension.name, kind: extension.kind, publisherKind: extension.publisher.kind };
}

function buildRows(extensions: readonly Extension[]): readonly HookEventRow[] {
  const entriesByEvent = new Map<string, HookEntryRef[]>();
  for (const extension of extensions) {
    const ref = toEntryRef(extension);
    // An entry that repeats an event still counts once.
    for (const event of new Set(extension.hooks)) {
      const entries = entriesByEvent.get(event) ?? [];
      entries.push(ref);
      entriesByEvent.set(event, entries);
    }
  }
  return [...entriesByEvent]
    .map(([event, entries]) => ({ event, entries: [...entries].sort((left, right) => compareText(left.name, right.name) || compareText(left.slug, right.slug)) }))
    .sort((left, right) => compareText(left.event, right.event));
}

/** Groups every hook event in `extensions` by the system it belongs to. Pure: same input, same output. */
export function buildHooksIndex(extensions: readonly Extension[]): HooksIndex {
  const modEntries = extensions.filter((extension) => extension.kind === "mod");
  const otherEntries = extensions.filter((extension) => extension.kind !== "mod");
  return { functionHooks: buildRows(modEntries), classicHooks: buildRows(otherEntries) };
}
