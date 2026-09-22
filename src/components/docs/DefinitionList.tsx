import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DefinitionItem {
  /** Stable key for React; usually the term as plain text. */
  readonly id: string;
  readonly term: ReactNode;
  readonly description: ReactNode;
  /**
   * When set, rendered as the row's own DOM `id`, so it becomes a real deep link target (`globals.css`
   * already offsets every `[id]` below the sticky header). Opt in per row: `id` alone is reused across
   * several pages just as a React key, and is not always collision free with a page's other anchors
   * (for example this page's own "next" DocSection versus a "next" glossary term), so no id is
   * rendered unless a caller asks for one explicitly.
   */
  readonly anchorId?: string;
}

export interface DefinitionListProps {
  readonly items: readonly DefinitionItem[];
  readonly className?: string;
}

/**
 * Term and description rows separated by hairlines. Stacks below md; from md the term sits in a
 * fixed left column so long lists stay scannable without cards.
 */
export function DefinitionList({ items, className }: DefinitionListProps): ReactNode {
  return (
    <dl className={cn("divide-y divide-border", className)}>
      {items.map((item) => (
        <div id={item.anchorId} key={item.id} className="grid gap-1.5 py-4 first:pt-0 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
          <dt className="text-base font-medium text-fg">{item.term}</dt>
          <dd className="flex max-w-[65ch] flex-col gap-2 text-base leading-relaxed text-fg-muted">
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}
