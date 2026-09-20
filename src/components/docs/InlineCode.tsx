import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InlineCodeProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** Monospace token for commands, field names and file paths inside running text. */
export function InlineCode({ children, className }: InlineCodeProps): ReactNode {
  return (
    <code
      className={cn(
        "break-words rounded-chip border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[0.875em] text-fg",
        className,
      )}
    >
      {children}
    </code>
  );
}
