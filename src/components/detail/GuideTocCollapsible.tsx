"use client";

import { CaretDown } from "@phosphor-icons/react/ssr";
import { useRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import type { GuideAnchor } from "./guide";
import { TOC_LABEL } from "./GuideToc";
import { GuideTocLinks } from "./GuideTocLinks";

export interface GuideTocCollapsibleProps {
  readonly anchors: readonly GuideAnchor[];
}

/**
 * Below xl: collapsed above the guide with a native disclosure. Tapping a link closes it, so the
 * reader lands on the section instead of under an open list. One delegated click handler, no
 * scroll listeners.
 */
export function GuideTocCollapsible({ anchors }: GuideTocCollapsibleProps): ReactNode {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function handleLinkClick(event: MouseEvent<HTMLDivElement>): void {
    const isLink = event.target instanceof Element && event.target.closest("a") !== null;
    if (!isLink || detailsRef.current === null) return;
    detailsRef.current.open = false;
  }

  return (
    <details ref={detailsRef} className="group rounded-panel border border-border bg-surface xl:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-panel px-4 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
        {TOC_LABEL}
        <CaretDown
          size={16}
          weight="regular"
          aria-hidden="true"
          className="shrink-0 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      {/* The click handler only delegates from the links inside; the links themselves stay focusable and keyboard operable. */}
      <div className="border-t border-border px-4 py-2" onClick={handleLinkClick}>
        <GuideTocLinks anchors={anchors} />
      </div>
    </details>
  );
}
