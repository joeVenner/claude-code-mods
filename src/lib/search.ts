import type { Extension, SearchFilters } from "@/lib/types";

/**
 * The fields search reads. A slim list projection satisfies this, so the client does not need the
 * long description or guide to search.
 */
export type SearchableExtension = Pick<
  Extension,
  "slug" | "name" | "kind" | "categories" | "summary" | "tags" | "hooks" | "availability"
>;

/** Lower rank wins. Name and slug hits outrank tag and hook hits, which outrank prose hits. */
const RANK_NAME_OR_SLUG = 0;
const RANK_TAG_OR_HOOK = 1;
const RANK_SUMMARY = 2;
const RANK_NO_MATCH = Number.POSITIVE_INFINITY;

function normalizeQuery(query: string | undefined): string {
  return (query ?? "").trim().toLowerCase();
}

function includesTerm(haystack: string, term: string): boolean {
  return haystack.toLowerCase().includes(term);
}

/**
 * Overall rank for a multi-word query: the worst (highest) rank among its terms. Every term must
 * match somewhere, so a multi-word query narrows results, and an entry ranks as low as the
 * weakest field any single term needed.
 */
function rankExtension(extension: SearchableExtension, terms: readonly string[]): number {
  let worstRank = RANK_NAME_OR_SLUG;
  for (const term of terms) {
    const termRank = rankTerm(extension, term);
    if (termRank === RANK_NO_MATCH) {
      return RANK_NO_MATCH;
    }
    worstRank = Math.max(worstRank, termRank);
  }
  return worstRank;
}

function rankTerm(extension: SearchableExtension, term: string): number {
  if (includesTerm(extension.name, term) || includesTerm(extension.slug, term)) {
    return RANK_NAME_OR_SLUG;
  }
  const isTagOrHookHit =
    extension.tags.some((tag) => includesTerm(tag, term)) ||
    extension.hooks.some((hook) => includesTerm(hook, term));
  if (isTagOrHookHit) {
    return RANK_TAG_OR_HOOK;
  }
  if (includesTerm(extension.summary, term)) {
    return RANK_SUMMARY;
  }
  return RANK_NO_MATCH;
}

function matchesFilters(extension: SearchableExtension, filters: SearchFilters): boolean {
  if (filters.kind !== undefined && extension.kind !== filters.kind) {
    return false;
  }
  if (filters.category !== undefined && !extension.categories.includes(filters.category)) {
    return false;
  }
  if (filters.availability !== undefined && extension.availability !== filters.availability) {
    return false;
  }
  return true;
}

/**
 * Filters and ranks extensions. Kind, category, availability and query all AND together.
 * Without a query the input order is preserved; with one, results are ordered by
 * match strength and ties keep input order (Array.prototype.sort is stable).
 */
export function searchExtensions<T extends SearchableExtension>(
  items: readonly T[],
  filters: SearchFilters,
): readonly T[] {
  const filtered = items.filter((item) => matchesFilters(item, filters));
  const terms = normalizeQuery(filters.query).split(/\s+/).filter((term) => term.length > 0);
  if (terms.length === 0) {
    return filtered;
  }
  return filtered
    .map((item) => ({ item, rank: rankExtension(item, terms) }))
    .filter(({ rank }) => rank !== RANK_NO_MATCH)
    .sort((left, right) => left.rank - right.rank)
    .map(({ item }) => item);
}
