import type { ReactNode } from "react";
import type { GuideAnchor } from "./guide";

export interface GuideTocLinksProps {
  readonly anchors: readonly GuideAnchor[];
}

export function GuideTocLinks({ anchors }: GuideTocLinksProps): ReactNode {
  return (
    <ol className="flex flex-col">
      {anchors.map((anchor) => (
        <li key={anchor.id}>
          <a
            href={`#${anchor.id}`}
            className="flex min-h-11 items-center rounded-control py-1.5 text-sm text-fg-muted transition-colors duration-150 hover:text-fg xl:min-h-0"
          >
            {anchor.title}
          </a>
        </li>
      ))}
    </ol>
  );
}
