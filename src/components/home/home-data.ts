import type { Extension, ExtensionKind } from "@/lib/types";

/** Rows shown in the hero results list; the browse page is the place for the rest. */
export const HERO_RESULT_LIMIT = 5;

/** The featured ledger stays scannable up to this many rows; more belong on the browse page. */
const MAX_FEATURED_TOTAL = 6;
const FALLBACK_FEATURED_TOTAL = 3;

/** Install section shows commands from at most this many listings, one per kind. */
const MAX_INSTALL_EXAMPLES = 2;

/** Hook events named on a featured row before the rest collapse into a count. */
const MAX_HOOKS_SHOWN = 3;

const RUN_FROM_SOURCE_LABEL = "Run from source";
const GITHUB_HOST = "github.com";

export type KindFilter = ExtensionKind | "all";

export interface BrowseHrefInput {
  readonly query: string;
  readonly kind: KindFilter;
}

/**
 * Builds the browse URL for a hero search. `URLSearchParams` handles the encoding, and empty
 * values are dropped so the link stays as short as the state it represents.
 */
export function buildBrowseHref({ query, kind }: BrowseHrefInput): string {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 0) params.set("q", trimmedQuery);
  if (kind !== "all") params.set("kind", kind);
  const serialized = params.toString();
  return serialized.length > 0 ? `/browse/?${serialized}` : "/browse/";
}

/** Live-region text for the hero search. Kept pure so the wording is testable. */
export function describeResultCount(total: number, shown: number): string {
  if (total === 0) return "No results";
  return `Showing ${shown} of ${total} ${total === 1 ? "result" : "results"}`;
}

function compareByStarsDescending(left: Extension, right: Extension): number {
  return (right.stars?.count ?? 0) - (left.stars?.count ?? 0);
}

export interface FeaturedPick {
  readonly extensions: readonly Extension[];
  /** True for maintainer-featured entries. False means the entries are only the most starred. */
  readonly isEditorial: boolean;
}

/**
 * Entries for the featured section. Any featured entry is shown as it is (one is enough for a
 * row). With none featured, the most-starred entries stand in and `isEditorial` is false so the
 * section can say so. Only entries with a captured star count qualify, so "most starred" is
 * never claimed for an entry with no stars. Array.prototype.sort is stable, so ties keep catalog
 * order. An empty result is valid and the section renders nothing.
 */
export function pickFeatured(featured: readonly Extension[], all: readonly Extension[]): FeaturedPick {
  if (featured.length > 0) {
    return { extensions: featured.slice(0, MAX_FEATURED_TOTAL), isEditorial: true };
  }
  const starred = all.filter((extension) => extension.stars !== null);
  return {
    extensions: [...starred].sort(compareByStarsDescending).slice(0, FALLBACK_FEATURED_TOTAL),
    isEditorial: false,
  };
}

/**
 * Real, installable listings for the install section. Only entries that are `installable` and
 * carry commands qualify, and each additional example must be a different kind so the copy can
 * show that the syntax belongs to the listing, not to the site. Two kinds of entry are left out
 * on purpose: community listings, because the home page is not the place to put a command from
 * an unreviewed submission in front of a first-time visitor, and mods, which are read from source.
 */
export function pickInstallExamples(candidates: readonly Extension[]): readonly Extension[] {
  const examples: Extension[] = [];
  const seenKinds = new Set<ExtensionKind>();
  for (const candidate of candidates) {
    if (examples.length >= MAX_INSTALL_EXAMPLES) break;
    const isInstallable =
      candidate.availability === "installable" &&
      candidate.kind !== "mod" &&
      candidate.publisher.kind !== "community" &&
      candidate.installCommands.length > 0;
    if (!isInstallable || seenKinds.has(candidate.kind)) continue;
    seenKinds.add(candidate.kind);
    examples.push(candidate);
  }
  return examples;
}

export interface RunFromSourceExample {
  readonly extension: Extension;
  /** Exactly the stored command, never composed here. */
  readonly command: string;
}

/**
 * The first entry with a stored "Run from source" command. Only the entry's own `details` count,
 * so nothing here invents a step for an entry that does not list one.
 */
export function pickRunFromSource(candidates: readonly Extension[]): RunFromSourceExample | null {
  for (const extension of candidates) {
    const detail = extension.details.find(
      (candidate) => candidate.isCommand && candidate.label === RUN_FROM_SOURCE_LABEL,
    );
    if (detail !== undefined) return { extension, command: detail.value };
  }
  return null;
}

/** "owner/repo" from a GitHub URL, or null for anything else (including malformed input). */
export function githubRepositoryName(repositoryUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(repositoryUrl);
  } catch {
    return null;
  }
  if (url.hostname !== GITHUB_HOST) return null;
  const [owner, repository] = url.pathname.split("/").filter((segment) => segment.length > 0);
  if (owner === undefined || repository === undefined) return null;
  return `${owner}/${repository}`;
}

export interface HooksSummary {
  /** For example "12 hooks". */
  readonly countLabel: string;
  /** The first events, in stored order, wildcards such as `classic.*` kept as text. */
  readonly shown: readonly string[];
  /** How many events are not shown. */
  readonly hiddenCount: number;
}

/** Null when the entry names no events, so callers can skip the block instead of printing "0 hooks". */
export function summarizeHooks(hooks: readonly string[]): HooksSummary | null {
  if (hooks.length === 0) return null;
  return {
    countLabel: `${hooks.length} ${hooks.length === 1 ? "hook" : "hooks"}`,
    shown: hooks.slice(0, MAX_HOOKS_SHOWN),
    hiddenCount: Math.max(0, hooks.length - MAX_HOOKS_SHOWN),
  };
}

/** Mods that Anthropic ships inside Claude Code. Community entries never qualify. */
export function selectBuiltInMods(extensions: readonly Extension[]): readonly Extension[] {
  return extensions.filter(
    (extension) =>
      extension.kind === "mod" && extension.availability === "built-in" && extension.publisher.kind === "anthropic",
  );
}

/** The first `count` sentences of a text, split after ". ", "! " or "? ". Returns the whole text if shorter. */
export function leadSentences(text: string, count: number): string {
  const sentences = text.trim().split(/(?<=[.!?])\s+/);
  return sentences.slice(0, count).join(" ");
}

/**
 * The opening sentences the entries' own notices agree on, or null when a notice is missing or
 * the notices differ. Caveats such as "early access" are only repeated on the home page when
 * every entry in the group actually says the same thing.
 */
export function sharedNoticeLead(entries: readonly Pick<Extension, "notice">[], count: number): string | null {
  const leads = entries.map((entry) => (entry.notice === null ? null : leadSentences(entry.notice, count)));
  const [first, ...rest] = leads;
  if (first === null || first === undefined) return null;
  return rest.every((lead) => lead === first) ? first : null;
}

/**
 * One line about the built-in mods, derived from the entries: how many Anthropic publishes, where,
 * and the caveat their own notices share. Null when there are none, so the page shows only the
 * neutral definition.
 */
export function describeBuiltInMods(extensions: readonly Extension[]): string | null {
  const mods = selectBuiltInMods(extensions);
  if (mods.length === 0) return null;

  const repositories = new Set<string>();
  for (const mod of mods) {
    const name = githubRepositoryName(mod.repositoryUrl);
    if (name !== null) repositories.add(name);
  }
  const [onlyRepository] = repositories;
  const location = repositories.size === 1 && onlyRepository !== undefined ? ` in ${onlyRepository}` : "";
  const isSingle = mods.length === 1;

  const sentences = [
    `Anthropic publishes ${mods.length} ${isSingle ? "mod" : "mods"}${location}.`,
    `${isSingle ? "It ships" : "They ship"} built in.`,
  ];
  const caveat = sharedNoticeLead(mods, 1);
  if (caveat !== null) sentences.push(caveat);
  return sentences.join(" ");
}
