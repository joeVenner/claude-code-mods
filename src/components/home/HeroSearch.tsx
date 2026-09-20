"use client";

import { ArrowRight } from "@phosphor-icons/react/ssr";
import { motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ExtensionRow } from "@/components/catalog/ExtensionRow";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchField } from "@/components/ui/SearchField";
import { cn } from "@/lib/cn";
import { searchExtensions } from "@/lib/search";
import { EXTENSION_KINDS, KIND_LABELS } from "@/lib/types";
import type { Extension } from "@/lib/types";
import { HERO_RESULT_LIMIT, buildBrowseHref, describeResultCount } from "./home-data";
import type { KindFilter } from "./home-data";

export interface HeroSearchProps {
  readonly extensions: readonly Extension[];
}

const KIND_FILTER_OPTIONS: readonly KindFilter[] = ["all", ...EXTENSION_KINDS];

/** Rows in the hero are compact: no category chips, one summary line. */
const COMPACT_ROW_CLASSES =
  "[&_article]:py-2.5 [&_.line-clamp-2]:line-clamp-1 [&_ul]:hidden";

function kindFilterLabel(kind: KindFilter): string {
  return kind === "all" ? "All" : KIND_LABELS[kind];
}

/**
 * Working catalog search for the hero. It filters the real catalog in the browser with the same
 * `searchExtensions` the browse page uses, so what you see here is what "See all" opens.
 * With no query it lists the first entries in catalog order (featured first).
 */
export function HeroSearch({ extensions }: HeroSearchProps): ReactNode {
  const searchFieldId = useId();
  const shouldReduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  // Rows fade in only after the list has changed; the first paint should not replay an entry animation.
  const [hasInteracted, setHasInteracted] = useState(false);

  const results = useMemo(
    () => searchExtensions(extensions, { query, kind: kind === "all" ? undefined : kind }),
    [extensions, query, kind],
  );
  const visibleResults = results.slice(0, HERO_RESULT_LIMIT);
  const totalCount = results.length;
  const hasFilters = query.trim().length > 0 || kind !== "all";

  function handleQueryChange(nextQuery: string): void {
    setHasInteracted(true);
    setQuery(nextQuery);
  }

  function handleKindChange(nextKind: KindFilter): void {
    setHasInteracted(true);
    setKind(nextKind);
  }

  function handleReset(): void {
    setHasInteracted(true);
    setQuery("");
    setKind("all");
  }

  return (
    <div className="flex flex-col gap-4 rounded-panel border border-border-strong bg-surface p-4 md:p-5">
      <h2 className="sr-only">Directory search</h2>
      <SearchField
        id={searchFieldId}
        label="Search the directory"
        value={query}
        onChange={handleQueryChange}
        placeholder="Name, tag, or hook"
      />

      <div role="group" aria-label="Filter by kind" className="flex flex-wrap gap-1.5">
        {KIND_FILTER_OPTIONS.map((option) => {
          const isActive = option === kind;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleKindChange(option)}
              className={cn(
                "inline-flex min-h-11 items-center whitespace-nowrap rounded-chip border px-2.5 font-mono text-xs",
                "transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.98] md:min-h-8",
                isActive
                  ? "border-accent bg-accent-soft text-accent-text"
                  : "border-border-strong bg-transparent text-fg-muted hover:border-fg-muted hover:text-fg",
              )}
            >
              {kindFilterLabel(option)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 lg:min-h-[19.5rem]">
        <p role="status" aria-live="polite" aria-atomic="true" className="font-mono text-xs text-fg-muted">
          {describeResultCount(totalCount, visibleResults.length)}
        </p>

        {visibleResults.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {visibleResults.map((extension) => (
              <motion.li
                key={extension.slug}
                layout={shouldReduceMotion ? false : "position"}
                initial={hasInteracted && !shouldReduceMotion ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                className={COMPACT_ROW_CLASSES}
              >
                <ExtensionRow extension={extension} />
              </motion.li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No listings match"
            body="Nothing in the directory matches that search and kind. Try another word or clear the filters."
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={handleReset}>
                  Clear search and filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      {totalCount > 0 ? (
        <div className="border-t border-border pt-3">
          <Button
            variant="ghost"
            href={buildBrowseHref({ query, kind })}
            iconRight={<ArrowRight size={16} weight="regular" aria-hidden="true" />}
            className="font-mono text-sm"
          >
            {`See all ${totalCount} ${totalCount === 1 ? "result" : "results"}`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
