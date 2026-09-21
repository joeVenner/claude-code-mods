"use client";

import { CaretDown, SlidersHorizontal } from "@phosphor-icons/react/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchField } from "@/components/ui/SearchField";
import { cn } from "@/lib/cn";
import type { ExtensionListItem } from "@/components/catalog/ExtensionListItem";
import { FilterPanel } from "./FilterPanel";
import { ResultsGrid } from "./ResultsGrid";
import {
  applyBrowseState,
  clearFilters,
  countActiveFilters,
  hasActiveFilters,
  isBrowseSort,
  normalizeQuery,
  parseFilters,
  serializeFilters,
} from "./filters";
import type { BrowseSort, BrowseState } from "./filters";
import { isTextEntryTarget } from "./keyboard";
import { BROWSE_LAYOUT_CLASSES, BROWSE_PATH, RAIL_STICKY_CLASSES, SEARCH_INPUT_ID } from "./layout";
import { createQueryState, queryReducer } from "./queryState";

export const QUERY_DEBOUNCE_MS = 200;

export interface BrowseExplorerProps {
  /** The full catalog, passed from the server page so nothing is fetched on the client. */
  readonly extensions: readonly ExtensionListItem[];
}

interface SortOption {
  readonly value: BrowseSort;
  readonly label: string;
}

function getSortOptions(isSearching: boolean): readonly SortOption[] {
  return [
    // Without a query the catalog order is featured-first; with one it is match rank.
    { value: "featured", label: isSearching ? "Best match" : "Featured" },
    { value: "name", label: "Name (A to Z)" },
    { value: "stars", label: "Most stars" },
  ];
}

function formatResultCount(count: number): string {
  return `${count} ${count === 1 ? "extension" : "extensions"}`;
}

/**
 * Search, filter and sort the catalog. The URL holds every setting (`q`, `kind`, `category`,
 * `availability`, `sort`); facet changes write it immediately and the text query writes it after a
 * short pause. The input itself is local state so typing is never delayed.
 */
export function BrowseExplorer({ extensions }: BrowseExplorerProps): ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersPanelId = useId();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // `searchParams` is a new object on some renders; the string is a stable dependency.
  const searchParamsKey = searchParams.toString();
  const urlState = useMemo(() => parseFilters(new URLSearchParams(searchParamsKey)), [searchParamsKey]);

  const [query, dispatchQuery] = useReducer(queryReducer, urlState.query, createQueryState);
  if (query.seenUrlQuery !== urlState.query) {
    dispatchQuery({ type: "urlChanged", urlQuery: urlState.query });
  }

  // Results reflect the query that was last committed, not the raw input, so the announced
  // count changes once per pause instead of once per keystroke.
  const appliedState = useMemo<BrowseState>(() => ({ ...urlState, query: query.applied }), [urlState, query.applied]);
  const results = useMemo(() => applyBrowseState(extensions, appliedState), [extensions, appliedState]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestUrlStateRef = useRef<BrowseState>(urlState);

  useEffect(() => {
    latestUrlStateRef.current = urlState;
  }, [urlState]);

  const cancelPendingQueryWrite = useCallback((): void => {
    if (debounceTimerRef.current === null) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);

  useEffect(() => cancelPendingQueryWrite, [cancelPendingQueryWrite]);

  const commit = useCallback(
    (next: BrowseState): void => {
      dispatchQuery({ type: "committed", query: next.query });
      const serialized = serializeFilters(next);
      // scroll: false keeps the list where it is when a filter changes.
      router.replace(serialized === "" ? BROWSE_PATH : `${BROWSE_PATH}?${serialized}`, { scroll: false });
    },
    [router],
  );

  function handleQueryChange(value: string): void {
    dispatchQuery({ type: "typed", value });
    cancelPendingQueryWrite();
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      commit({ ...latestUrlStateRef.current, query: normalizeQuery(value) });
    }, QUERY_DEBOUNCE_MS);
  }

  function handleFacetChange(patch: Partial<BrowseState>): void {
    // Any pending text write is folded into this one so the URL never lags behind the input.
    cancelPendingQueryWrite();
    commit({ ...urlState, query: normalizeQuery(query.input), ...patch });
  }

  function handleClear(): void {
    cancelPendingQueryWrite();
    dispatchQuery({ type: "typed", value: "" });
    commit(clearFilters(urlState));
  }

  function handleSortChange(value: string): void {
    if (!isBrowseSort(value)) return;
    handleFacetChange({ sort: value });
  }

  // `/` jumps to search, like most developer tools. One document listener, removed on unmount.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== "/" || event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextEntryTarget(event.target)) return;
      const searchInput = document.getElementById(SEARCH_INPUT_ID);
      if (searchInput === null) return;
      event.preventDefault();
      searchInput.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasFilters = hasActiveFilters(appliedState);
  const activeFilterCount = countActiveFilters(appliedState);
  const isSearching = appliedState.query.length > 0;
  const resultCountLabel = formatResultCount(results.length);

  return (
    <div className={BROWSE_LAYOUT_CLASSES}>
      <SearchField
        id={SEARCH_INPUT_ID}
        label="Search extensions"
        value={query.input}
        onChange={handleQueryChange}
        hint="Matches names, tags, and hooks. Press / to jump here."
        placeholder="For example: lint, git, MCP"
        className="md:col-start-2"
      />

      <aside aria-label="Filters" className={cn("md:col-start-1 md:row-span-2 md:row-start-1", RAIL_STICKY_CLASSES)}>
        <button
          type="button"
          aria-label={activeFilterCount > 0 ? `Filters, ${activeFilterCount} active` : undefined}
          aria-expanded={isFiltersOpen}
          aria-controls={filtersPanelId}
          onClick={() => setIsFiltersOpen((isOpen) => !isOpen)}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-control border border-control-border bg-surface px-4 text-sm font-medium text-fg transition-transform duration-150 active:scale-[0.98] md:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={18} weight="regular" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-chip bg-accent-soft px-1.5 font-mono text-xs text-accent-text">
                {activeFilterCount}
              </span>
            ) : null}
          </span>
          <CaretDown
            size={16}
            weight="regular"
            aria-hidden="true"
            className={cn("transition-transform duration-150", isFiltersOpen && "rotate-180")}
          />
        </button>

        <div id={filtersPanelId} className={cn("pt-4 md:block md:pt-0", isFiltersOpen ? "block" : "hidden")}>
          <FilterPanel
            items={extensions}
            state={appliedState}
            hasActiveFilters={hasFilters}
            onKindChange={(kind) => handleFacetChange({ kind })}
            onCategoryChange={(category) => handleFacetChange({ category })}
            onAvailabilityChange={(availability) => handleFacetChange({ availability })}
            onClear={handleClear}
          />
        </div>
      </aside>

      <section aria-labelledby="browse-results-heading" className="@container flex min-w-0 flex-col gap-4 md:col-start-2">
        <h2 id="browse-results-heading" className="sr-only">
          Results
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p aria-live="polite" aria-atomic="true" className="font-mono text-sm text-fg-muted">
            {resultCountLabel}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="browse-sort" className="text-sm text-fg-muted">
              Sort by
            </label>
            <select
              id="browse-sort"
              value={appliedState.sort}
              onChange={(event) => handleSortChange(event.target.value)}
              className="min-h-11 rounded-control border border-control-border bg-surface px-3 text-base text-fg md:min-h-10 md:text-sm"
            >
              {getSortOptions(isSearching).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {results.length > 0 ? (
          <ResultsGrid items={results} />
        ) : (
          <EmptyState
            title="No extensions match"
            body="Nothing fits the current search and filters. Remove a filter or try a different term."
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={handleClear}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  );
}
