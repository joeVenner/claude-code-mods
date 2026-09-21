import { Users } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Publisher } from "@/lib/types";

export interface CommunityBadgeProps {
  readonly publisher: Pick<Publisher, "kind">;
  readonly className?: string;
}

/** The plain-language explanation shown under the publisher on detail pages and in the badge tooltip. */
export const COMMUNITY_LISTING_NOTE =
  "Community listing. Not published by Anthropic; a maintainer read the entry, not the code.";

/**
 * Marks entries that anyone can submit, so a name or description that sounds official is never the
 * only signal. Renders nothing for Anthropic and MCP project entries.
 */
export function CommunityBadge({ publisher, className }: CommunityBadgeProps): ReactNode {
  if (publisher.kind !== "community") return null;
  return (
    <span
      title={COMMUNITY_LISTING_NOTE}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-chip border border-border-strong bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg",
        className,
      )}
    >
      <Users size={12} weight="regular" aria-hidden="true" />
      Community listing
      <span className="sr-only">. Not published by Anthropic.</span>
    </span>
  );
}
