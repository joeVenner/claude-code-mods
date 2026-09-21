import { Check } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Verification } from "@/lib/types";

export interface StatusBadgeProps {
  readonly verification: Verification;
  readonly className?: string;
}

/**
 * Says how far an entry's claims can be trusted, never that it is endorsed.
 * Every listed entry is verified, and that only means the source URL responded on the recorded
 * date; it is not a security review.
 */
export function StatusBadge({ verification, className }: StatusBadgeProps): ReactNode {
  const meaning = `Source URL responded on ${verification.checkedAt}. Not a security review.`;
  return (
    <span
      title={meaning}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-chip border border-transparent bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-text",
        className,
      )}
    >
      <Check size={12} weight="regular" aria-hidden="true" />
      Source verified
      <span className="sr-only">. {meaning}</span>
    </span>
  );
}
