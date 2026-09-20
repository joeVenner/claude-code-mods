import { Check } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Verification } from "@/lib/types";

export interface StatusBadgeProps {
  readonly verification: Verification;
  readonly className?: string;
}

const BADGE_BASE_CLASSES =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-chip border px-2 py-0.5 text-xs font-medium";

/**
 * Says how far an entry's claims can be trusted, never that it is endorsed.
 * `verified` only means the source URL responded on the recorded date; it is not a security review.
 */
export function StatusBadge({ verification, className }: StatusBadgeProps): ReactNode {
  if (verification.status === "verified") {
    const meaning = `Source URL responded on ${verification.checkedAt}. Not a security review.`;
    return (
      <span
        title={meaning}
        className={cn(BADGE_BASE_CLASSES, "border-transparent bg-accent-soft text-accent-text", className)}
      >
        <Check size={12} weight="regular" aria-hidden="true" />
        Source verified
        <span className="sr-only">. {meaning}</span>
      </span>
    );
  }

  const meaning = "Proposed design, no public implementation.";
  return (
    <span
      title={meaning}
      className={cn(BADGE_BASE_CLASSES, "border-dashed border-border-strong text-fg-muted", className)}
    >
      Concept
      <span className="sr-only">. {meaning}</span>
    </span>
  );
}
