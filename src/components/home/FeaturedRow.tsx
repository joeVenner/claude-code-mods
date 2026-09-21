import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { AvailabilityChip } from "@/components/catalog/AvailabilityChip";
import { extensionHref } from "@/components/catalog/ExtensionCard";
import { KindIcon } from "@/components/catalog/KindIcon";
import { StarCount } from "@/components/catalog/StarCount";
import { KIND_LABELS } from "@/lib/types";
import type { Extension } from "@/lib/types";
import { summarizeHooks } from "./home-data";

export interface FeaturedRowProps {
  readonly extension: Extension;
  /** True when the row is ranked by stars, so the count is shown even for entries that have hooks. */
  readonly isStarRanked?: boolean;
}

/** Hooks in mono when the entry has any, otherwise stars when captured, otherwise nothing. */
function FeaturedFacts({ extension, isStarRanked = false }: FeaturedRowProps): ReactNode {
  const hooks = summarizeHooks(extension.hooks);
  if (hooks !== null) {
    return (
      <div className="flex flex-col gap-1.5 font-mono text-xs text-fg-muted">
        {isStarRanked ? <StarCount stars={extension.stars} className="text-fg" /> : null}
        <p className="text-fg">{hooks.countLabel}</p>
        <ul aria-label="First hooks" className="flex flex-col gap-0.5">
          {hooks.shown.map((hook) => (
            <li key={hook}>{hook}</li>
          ))}
          {hooks.hiddenCount > 0 ? <li>{`+${hooks.hiddenCount} more`}</li> : null}
        </ul>
      </div>
    );
  }
  return <StarCount stars={extension.stars} className="font-mono text-xs text-fg-muted" />;
}

/**
 * One row of the featured ledger: name and availability, the summary, then what it hooks. The
 * name carries a stretched link, so the row is one target and the accessible link text is the name.
 */
export function FeaturedRow({ extension, isStarRanked = false }: FeaturedRowProps): ReactNode {
  const { slug, name, kind, summary, availability } = extension;

  return (
    <article className="group relative grid gap-3 px-3 py-6 transition-colors duration-150 hover:bg-surface has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_minmax(0,3fr)] md:gap-8">
      <div className="flex flex-col items-start gap-2">
        <h3 className="text-xl font-semibold leading-snug tracking-tight text-fg">
          <Link href={extensionHref(slug)} className="outline-none after:absolute after:inset-0 after:content-['']">
            {name}
          </Link>
          <ArrowUpRight
            size={18}
            weight="regular"
            aria-hidden="true"
            className="ml-1.5 inline text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
          />
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="flex items-center gap-1.5 font-mono text-xs text-fg-muted">
            <KindIcon kind={kind} size={14} />
            {KIND_LABELS[kind]}
          </p>
          <AvailabilityChip availability={availability} />
        </div>
      </div>
      <p className="max-w-[60ch] text-sm leading-relaxed text-fg-muted">{summary}</p>
      <FeaturedFacts extension={extension} isStarRanked={isStarRanked} />
    </article>
  );
}
