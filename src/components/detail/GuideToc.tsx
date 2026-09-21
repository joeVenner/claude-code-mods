import type { ReactNode } from "react";
import type { GuideAnchor } from "./guide";
import { GuideTocLinks } from "./GuideTocLinks";

export interface GuideTocProps {
  readonly anchors: readonly GuideAnchor[];
}

export const TOC_LABEL = "On this page";

/**
 * Wide screens: a sticky column beside the guide. It is the only element with the "On this page"
 * navigation landmark, so assistive tech is not offered the same list twice.
 */
export function GuideTocSidebar({ anchors }: GuideTocProps): ReactNode {
  return (
    <nav aria-label={TOC_LABEL} className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
      <p className="mb-3 text-sm font-semibold text-fg">{TOC_LABEL}</p>
      <div className="border-l border-border pl-4">
        <GuideTocLinks anchors={anchors} />
      </div>
    </nav>
  );
}
