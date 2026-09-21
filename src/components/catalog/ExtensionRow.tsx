import Link from "next/link";
import type { ReactNode } from "react";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { CATEGORY_LABELS, KIND_LABELS } from "@/lib/types";
import { extensionHref } from "./ExtensionCard";
import { AvailabilityChip } from "./AvailabilityChip";
import { CommunityBadge } from "./CommunityBadge";
import type { ExtensionListItem } from "./ExtensionListItem";
import { KindIcon } from "./KindIcon";
import { StarCount } from "./StarCount";
import { StatusBadge } from "./StatusBadge";

export interface ExtensionRowProps {
  readonly extension: ExtensionListItem;
  /** Marks the row for the entry currently in focus (for example a selected search result). */
  readonly isActive?: boolean;
  readonly className?: string;
}

const MAX_CATEGORY_CHIPS = 2;

// Lifts tooltip-bearing elements above the stretched link so their `title` stays hoverable.
const ABOVE_LINK_OVERLAY = "relative z-10";

/** Compact result-list row. Wrap rows in a `ul`/`li` and separate them with `divide-y`. */
export function ExtensionRow({ extension, isActive = false, className }: ExtensionRowProps): ReactNode {
  const { slug, name, kind, summary, categories, verification, stars, availability, publisher } = extension;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-control px-3 py-4 transition-colors duration-150 md:flex-row md:items-center md:gap-6",
        isActive ? "bg-surface-2" : "hover:bg-surface",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-base font-semibold tracking-tight text-fg">
            <Link
              href={extensionHref(slug)}
              aria-current={isActive ? "true" : undefined}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {name}
            </Link>
          </h3>
          <p className="flex items-center gap-1.5 font-mono text-xs text-fg-muted">
            <KindIcon kind={kind} size={14} />
            {KIND_LABELS[kind]}
          </p>
        </div>
        <p className="line-clamp-2 text-sm leading-relaxed text-fg-muted">{summary}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:justify-end">
        <ul className="flex flex-wrap gap-1.5" aria-label="Categories">
          {categories.slice(0, MAX_CATEGORY_CHIPS).map((category) => (
            <li key={category}>
              <Chip>{CATEGORY_LABELS[category]}</Chip>
            </li>
          ))}
        </ul>
        {availability === "built-in" ? <AvailabilityChip availability={availability} /> : null}
        <CommunityBadge publisher={publisher} className={ABOVE_LINK_OVERLAY} />
        <StatusBadge verification={verification} className={ABOVE_LINK_OVERLAY} />
        <StarCount stars={stars} className={cn("whitespace-nowrap font-mono text-xs text-fg-muted", ABOVE_LINK_OVERLAY)} />
      </div>
    </article>
  );
}
