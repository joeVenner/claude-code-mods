import type { Extension, ExtensionKind } from "@/lib/types";

/** Rows shown in the hero results list; the browse page is the place for the rest. */
export const HERO_RESULT_LIMIT = 5;

/** Featured section shows one lead and up to this many supporting entries. */
const MAX_FEATURED_TOTAL = 4;
const MIN_FEATURED_FOR_SECTION = 2;
const FALLBACK_FEATURED_TOTAL = 3;

/** Install section shows commands from at most this many listings, one per kind. */
const MAX_INSTALL_EXAMPLES = 2;

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
  return (right.stars?.count ?? -1) - (left.stars?.count ?? -1);
}

/**
 * Entries for the featured section: the editorial picks when there are enough of them,
 * otherwise the most-starred entries. Array.prototype.sort is stable, so ties keep catalog order.
 */
export function pickFeatured(
  featured: readonly Extension[],
  all: readonly Extension[],
): readonly Extension[] {
  if (featured.length >= MIN_FEATURED_FOR_SECTION) {
    return featured.slice(0, MAX_FEATURED_TOTAL);
  }
  return [...all].sort(compareByStarsDescending).slice(0, FALLBACK_FEATURED_TOTAL);
}

/**
 * Real, installable listings for the install section. Only verified entries with commands
 * qualify, and each additional example must be a different kind so the copy can show that
 * the syntax belongs to the listing, not to the site.
 */
export function pickInstallExamples(candidates: readonly Extension[]): readonly Extension[] {
  const examples: Extension[] = [];
  const seenKinds = new Set<ExtensionKind>();
  for (const candidate of candidates) {
    if (examples.length >= MAX_INSTALL_EXAMPLES) break;
    const isInstallable = candidate.verification.status === "verified" && candidate.installCommands.length > 0;
    if (!isInstallable || seenKinds.has(candidate.kind)) continue;
    seenKinds.add(candidate.kind);
    examples.push(candidate);
  }
  return examples;
}
