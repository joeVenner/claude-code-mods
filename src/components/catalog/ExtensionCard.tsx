import Link from "next/link";
import type { ReactNode } from "react";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { CATEGORY_LABELS, KIND_LABELS } from "@/lib/types";
import type { Extension } from "@/lib/types";
import { KindIcon } from "./KindIcon";
import { StarCount } from "./StarCount";
import { StatusBadge } from "./StatusBadge";

export interface ExtensionCardProps {
  readonly extension: Extension;
  readonly className?: string;
}

const MAX_CATEGORY_CHIPS = 2;

// Lifts tooltip-bearing elements above the stretched link so their `title` stays hoverable.
const ABOVE_LINK_OVERLAY = "relative z-10";

/** Path of an extension's detail page; trailing slash matches the static export. */
export function extensionHref(slug: string): string {
  return `/extensions/${slug}/`;
}

/**
 * Whole-card link using a stretched anchor on the name, so the accessible link text is just the
 * name. The focus ring is drawn on the card via `:has()` because the anchor itself is inline.
 */
export function ExtensionCard({ extension, className }: ExtensionCardProps): ReactNode {
  const { slug, name, kind, summary, categories, verification, stars } = extension;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col gap-4 rounded-panel border border-border bg-surface p-5",
        "transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-border-strong motion-reduce:hover:translate-y-0",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-xs text-fg-muted">
          <KindIcon kind={kind} size={16} />
          {KIND_LABELS[kind]}
        </p>
        <StatusBadge verification={verification} className={ABOVE_LINK_OVERLAY} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold leading-snug tracking-tight text-fg">
          <Link
            href={extensionHref(slug)}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-fg-muted">{summary}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <ul className="flex flex-wrap gap-1.5" aria-label="Categories">
          {categories.slice(0, MAX_CATEGORY_CHIPS).map((category) => (
            <li key={category}>
              <Chip>{CATEGORY_LABELS[category]}</Chip>
            </li>
          ))}
        </ul>
        <StarCount stars={stars} className={cn("whitespace-nowrap font-mono text-xs text-fg-muted", ABOVE_LINK_OVERLAY)} />
      </div>
    </article>
  );
}
