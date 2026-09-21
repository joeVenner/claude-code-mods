import type { ReactNode } from "react";
import { Chip } from "@/components/ui/Chip";
import type { Idea } from "@/lib/types";

export interface IdeaListProps {
  readonly ideas: readonly Idea[];
}

/**
 * One readable row per proposal, in file order. Each row is an anchor target (`#<slug>`), so a
 * link to a single idea survives the page being reordered. Rows are separated by hairlines, not
 * cards: the ideas are peers and nothing here should look like an installable listing.
 */
export function IdeaList({ ideas }: IdeaListProps): ReactNode {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {ideas.map((idea) => {
        const headingId = `${idea.slug}-heading`;
        return (
          <li key={idea.slug}>
            <article
              id={idea.slug}
              aria-labelledby={headingId}
              className="grid scroll-mt-24 gap-4 py-8 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8"
            >
              <div className="flex min-w-0 flex-col gap-1 text-sm leading-relaxed text-fg-muted">
                <p className="break-words font-mono text-xs text-fg-muted">{idea.slug}</p>
                <p>
                  <span className="text-fg">Spec reference</span>
                  <br />
                  {idea.specReference}
                </p>
              </div>
              <div className="flex min-w-0 max-w-[65ch] flex-col gap-4">
                <h2 id={headingId} className="text-xl font-semibold leading-[1.2] tracking-tight text-fg text-balance md:text-2xl">
                  {idea.name}
                </h2>
                <p className="text-base leading-relaxed text-fg">{idea.summary}</p>
                {idea.description.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-relaxed text-fg-muted">
                    {paragraph}
                  </p>
                ))}
                {idea.proposedEvents.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-fg">Proposed events, as the spec writes them</p>
                    <ul aria-label={`Proposed events for ${idea.name}`} className="flex flex-wrap gap-2">
                      {idea.proposedEvents.map((eventName) => (
                        <li key={eventName}>
                          <Chip className="font-mono">{eventName}</Chip>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
