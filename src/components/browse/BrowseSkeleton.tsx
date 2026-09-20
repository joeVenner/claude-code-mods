import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { BROWSE_LAYOUT_CLASSES, RESULTS_GRID_CLASSES } from "./layout";

const SKELETON_CARD_COUNT = 6;
const SKELETON_FILTER_ROWS = 6;

function SkeletonCard(): ReactNode {
  return (
    <div className="flex h-44 flex-col gap-4 rounded-panel border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="mt-auto flex gap-1.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

/**
 * Suspense fallback with the explorer's footprint: search field, filter rail (from md) and a
 * grid of card-shaped blocks. The pulse comes from `Skeleton`; the whole block announces once.
 */
export function BrowseSkeleton(): ReactNode {
  return (
    <div role="status" aria-busy="true" className={BROWSE_LAYOUT_CLASSES}>
      <span className="sr-only">Loading extensions</span>
      <Skeleton className="h-[4.75rem] w-full md:col-start-2" />
      <Skeleton className="h-11 w-full md:hidden" />
      <div className="hidden flex-col gap-3 md:col-start-1 md:row-span-2 md:row-start-1 md:flex">
        <Skeleton className="h-5 w-16" />
        {Array.from({ length: SKELETON_FILTER_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
      <div className="@container md:col-start-2">
        <div className={RESULTS_GRID_CLASSES}>
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
