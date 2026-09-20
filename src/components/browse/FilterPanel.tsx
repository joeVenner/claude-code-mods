import { useMemo } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CATEGORIES, CATEGORY_LABELS, EXTENSION_KINDS, KIND_LABELS } from "@/lib/types";
import type { Extension } from "@/lib/types";
import { ChoiceOption } from "./ChoiceOption";
import {
  BROWSE_STATUSES,
  countByFacet,
  countWithoutFacet,
  isBrowseStatus,
  isCategory,
  isExtensionKind,
} from "./filters";
import type { BrowseState } from "./filters";

export const STATUS_LABELS = {
  verified: "Source verified",
  concept: "Concept",
} as const;

export interface FilterPanelProps {
  readonly items: readonly Extension[];
  /** State the results currently reflect. Counts are computed from it. */
  readonly state: BrowseState;
  readonly hasActiveFilters: boolean;
  readonly onKindChange: (kind: BrowseState["kind"]) => void;
  readonly onCategoryChange: (category: BrowseState["category"]) => void;
  readonly onStatusChange: (status: BrowseState["status"]) => void;
  readonly onClear: () => void;
}

const LEGEND_CLASSES = "mb-2 text-sm font-medium text-fg";
const ALL_VALUE = "";

/**
 * Kind, category and status facets. Every count is computed with the other filters and the query
 * held fixed, so each option shows what choosing it would return.
 */
export function FilterPanel({
  items,
  state,
  hasActiveFilters,
  onKindChange,
  onCategoryChange,
  onStatusChange,
  onClear,
}: FilterPanelProps): ReactNode {
  const kindCounts = useMemo(() => countByFacet(items, state, "kind", EXTENSION_KINDS), [items, state]);
  const categoryCounts = useMemo(() => countByFacet(items, state, "category", CATEGORIES), [items, state]);
  const statusCounts = useMemo(() => countByFacet(items, state, "status", BROWSE_STATUSES), [items, state]);
  const anyKindCount = useMemo(() => countWithoutFacet(items, state, "kind"), [items, state]);
  const anyCategoryCount = useMemo(() => countWithoutFacet(items, state, "category"), [items, state]);
  const anyStatusCount = useMemo(() => countWithoutFacet(items, state, "status"), [items, state]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <h2 className="hidden text-sm font-semibold text-fg md:block">Filters</h2>
        {hasActiveFilters ? (
          <Button variant="ghost" onClick={onClear} className="md:-mr-2">
            Clear filters
          </Button>
        ) : null}
      </div>

      <fieldset>
        <legend className={LEGEND_CLASSES}>Kind</legend>
        <div className="flex flex-wrap gap-1.5">
          <ChoiceOption
            name="kind"
            value={ALL_VALUE}
            label="All kinds"
            isAlwaysEnabled
            count={anyKindCount}
            isChecked={state.kind === null}
            layout="chip"
            onSelect={() => onKindChange(null)}
          />
          {EXTENSION_KINDS.map((kind) => (
            <ChoiceOption
              key={kind}
              name="kind"
              value={kind}
              label={KIND_LABELS[kind]}
              count={kindCounts[kind]}
              isChecked={state.kind === kind}
              layout="chip"
              onSelect={(value) => onKindChange(isExtensionKind(value) ? value : null)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={LEGEND_CLASSES}>Category</legend>
        <div className="flex flex-col gap-1">
          <ChoiceOption
            name="category"
            value={ALL_VALUE}
            label="All categories"
            isAlwaysEnabled
            count={anyCategoryCount}
            isChecked={state.category === null}
            layout="row"
            onSelect={() => onCategoryChange(null)}
          />
          {CATEGORIES.map((category) => (
            <ChoiceOption
              key={category}
              name="category"
              value={category}
              label={CATEGORY_LABELS[category]}
              count={categoryCounts[category]}
              isChecked={state.category === category}
              layout="row"
              onSelect={(value) => onCategoryChange(isCategory(value) ? value : null)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={LEGEND_CLASSES}>Status</legend>
        <div className="flex flex-wrap gap-1.5">
          <ChoiceOption
            name="status"
            value={ALL_VALUE}
            label="Any status"
            count={anyStatusCount}
            isChecked={state.status === null}
            layout="chip"
            onSelect={() => onStatusChange(null)}
          />
          {BROWSE_STATUSES.map((status) => (
            <ChoiceOption
              key={status}
              name="status"
              value={status}
              label={STATUS_LABELS[status]}
              count={statusCounts[status]}
              isChecked={state.status === status}
              layout="chip"
              onSelect={(value) => onStatusChange(isBrowseStatus(value) ? value : null)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
