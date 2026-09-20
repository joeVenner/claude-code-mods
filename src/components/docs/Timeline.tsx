import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TimelineItem {
  readonly title: string;
  readonly description: string;
  /** Concrete checks or actions performed at this point, rendered as a plain list. */
  readonly details?: readonly string[];
}

export interface TimelineProps {
  readonly items: readonly TimelineItem[];
  /** Accessible name for the list, since the visual grouping has no heading of its own. */
  readonly label: string;
  /** Heading level for item titles; pick the level below the section heading. */
  readonly headingLevel?: "h3" | "h4";
  readonly className?: string;
}

/**
 * Vertical ordered timeline drawn with a border and square nodes. The order of items is the
 * order of the process, so the list is an `<ol>`; titles name the action instead of numbering it.
 */
export function Timeline({ items, label, headingLevel: Heading = "h3", className }: TimelineProps): ReactNode {
  return (
    <ol aria-label={label} className={cn("ml-1.5 border-l border-border-strong", className)}>
      {items.map((item) => (
        <li key={item.title} className="relative pb-10 pl-6 last:pb-0 md:pl-8">
          <span
            aria-hidden="true"
            className="absolute -left-[7px] top-1.5 size-3 rounded-chip border-2 border-border-strong bg-bg"
          />
          <Heading className="text-lg font-semibold leading-snug tracking-tight text-fg">{item.title}</Heading>
          <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-fg-muted">{item.description}</p>
          {item.details && item.details.length > 0 ? (
            <ul className="mt-3 flex max-w-[65ch] flex-col gap-1.5 text-sm leading-relaxed text-fg-muted">
              {item.details.map((detail) => (
                <li key={detail} className="border-l border-border pl-3">
                  {detail}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
