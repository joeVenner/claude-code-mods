import type { ReadonlyURLSearchParams } from "next/navigation";
import { searchExtensions } from "@/lib/search";
import { CATEGORIES, EXTENSION_KINDS } from "@/lib/types";
import type { Category, Extension, ExtensionKind, SearchFilters, Verification } from "@/lib/types";

/** Pure browse-page logic. The URL is the source of truth; everything here maps URL <-> state <-> results. */

export const BROWSE_SORTS = ["featured", "name", "stars"] as const;
export type BrowseSort = (typeof BROWSE_SORTS)[number];

export const BROWSE_STATUSES = ["verified", "concept"] as const;
export type BrowseStatus = Verification["status"];

/** Caps `q` so a pasted URL cannot make every keystroke rescan a huge string. */
export const MAX_QUERY_LENGTH = 100;

export interface BrowseState {
  readonly query: string;
  readonly kind: ExtensionKind | null;
  readonly category: Category | null;
  readonly status: BrowseStatus | null;
  readonly sort: BrowseSort;
}

export const DEFAULT_BROWSE_STATE: BrowseState = {
  query: "",
  kind: null,
  category: null,
  status: null,
  sort: "featured",
};

/** Anything with the `get` half of URLSearchParams, so tests and Next's read-only variant both fit. */
export type SearchParamsSource = URLSearchParams | ReadonlyURLSearchParams;

export function isExtensionKind(value: string | null): value is ExtensionKind {
  return value !== null && (EXTENSION_KINDS as readonly string[]).includes(value);
}

export function isCategory(value: string | null): value is Category {
  return value !== null && (CATEGORIES as readonly string[]).includes(value);
}

export function isBrowseStatus(value: string | null): value is BrowseStatus {
  return value !== null && (BROWSE_STATUSES as readonly string[]).includes(value);
}

export function isBrowseSort(value: string | null): value is BrowseSort {
  return value !== null && (BROWSE_SORTS as readonly string[]).includes(value);
}

/** Trims and length-caps a raw query so the same text always yields the same URL. */
export function normalizeQuery(rawQuery: string): string {
  return rawQuery.trim().slice(0, MAX_QUERY_LENGTH).trim();
}

/** Reads browse state from a query string. Unknown or invalid values fall back to defaults; never throws. */
export function parseFilters(searchParams: SearchParamsSource): BrowseState {
  const kind = searchParams.get("kind");
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const sort = searchParams.get("sort");
  return {
    query: normalizeQuery(searchParams.get("q") ?? ""),
    kind: isExtensionKind(kind) ? kind : DEFAULT_BROWSE_STATE.kind,
    category: isCategory(category) ? category : DEFAULT_BROWSE_STATE.category,
    status: isBrowseStatus(status) ? status : DEFAULT_BROWSE_STATE.status,
    sort: isBrowseSort(sort) ? sort : DEFAULT_BROWSE_STATE.sort,
  };
}

/** Query string without a leading `?`. Defaults are omitted and keys have a fixed order (q, kind, category, status, sort). */
export function serializeFilters(state: BrowseState): string {
  const params = new URLSearchParams();
  const query = normalizeQuery(state.query);
  if (query !== DEFAULT_BROWSE_STATE.query) params.set("q", query);
  if (state.kind !== null) params.set("kind", state.kind);
  if (state.category !== null) params.set("category", state.category);
  if (state.status !== null) params.set("status", state.status);
  if (state.sort !== DEFAULT_BROWSE_STATE.sort) params.set("sort", state.sort);
  return params.toString();
}

/** Number of facet filters (kind, category, status) in effect. Query and sort are shown elsewhere. */
export function countActiveFilters(state: BrowseState): number {
  return [state.kind, state.category, state.status].filter((value) => value !== null).length;
}

/** True when anything narrows the results. Sort is a view preference, not a filter. */
export function hasActiveFilters(state: BrowseState): boolean {
  return normalizeQuery(state.query).length > 0 || countActiveFilters(state) > 0;
}

/** Resets every filter and the query but keeps the chosen sort order. */
export function clearFilters(state: BrowseState): BrowseState {
  return { ...DEFAULT_BROWSE_STATE, sort: state.sort };
}

/** Maps browse state onto the data layer's filter shape (null means "not filtering"). */
export function toSearchFilters(state: BrowseState): SearchFilters {
  return {
    query: state.query,
    ...(state.kind !== null ? { kind: state.kind } : {}),
    ...(state.category !== null ? { category: state.category } : {}),
    ...(state.status !== null ? { status: state.status } : {}),
  };
}

/**
 * Stars descending with entries that have no star count last. Comparison is by count only, so
 * `Array.prototype.sort` stability keeps ties, and all the null entries, in their incoming order.
 */
function compareByStarsDescending(left: Extension, right: Extension): number {
  const leftStars = left.stars?.count ?? null;
  const rightStars = right.stars?.count ?? null;
  if (leftStars === null && rightStars === null) return 0;
  if (leftStars === null) return 1;
  if (rightStars === null) return -1;
  return rightStars - leftStars;
}

function compareByName(left: Extension, right: Extension): number {
  return left.name.localeCompare(right.name);
}

function sortExtensions(items: readonly Extension[], sort: BrowseSort): readonly Extension[] {
  // "featured" keeps the incoming order: catalog order without a query, match rank with one.
  if (sort === "featured") return items;
  return [...items].sort(sort === "name" ? compareByName : compareByStarsDescending);
}

/** Filters with `searchExtensions`, then applies the sort. Does not mutate `items`. */
export function applyBrowseState(items: readonly Extension[], state: BrowseState): readonly Extension[] {
  return sortExtensions(searchExtensions(items, toSearchFilters(state)), state.sort);
}

export type BrowseFacet = "kind" | "category" | "status";

/** Sets one facet on a state. An unrecognised value clears it, matching how the URL is parsed. */
function withFacet(state: BrowseState, facet: BrowseFacet, value: string | null): BrowseState {
  switch (facet) {
    case "kind":
      return { ...state, kind: isExtensionKind(value) ? value : null };
    case "category":
      return { ...state, category: isCategory(value) ? value : null };
    case "status":
      return { ...state, status: isBrowseStatus(value) ? value : null };
  }
}

/**
 * Result count for each value of one facet, holding every OTHER filter (and the query) fixed.
 * The facet's own current selection is ignored so its siblings show what selecting them would yield.
 */
export function countByFacet<Value extends string>(
  items: readonly Extension[],
  state: BrowseState,
  facet: BrowseFacet,
  values: readonly Value[],
): Readonly<Record<Value, number>> {
  const counts = {} as Record<Value, number>;
  for (const value of values) {
    counts[value] = searchExtensions(items, toSearchFilters(withFacet(state, facet, value))).length;
  }
  return counts;
}

/** Total for a facet when it is unset ("All kinds"), holding the other filters fixed. */
export function countWithoutFacet(items: readonly Extension[], state: BrowseState, facet: BrowseFacet): number {
  return searchExtensions(items, toSearchFilters(withFacet(state, facet, null))).length;
}
