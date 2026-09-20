import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChipTone = "neutral" | "accent";

export interface ChipProps {
  readonly children: ReactNode;
  readonly tone?: ChipTone;
  readonly className?: string;
}

const TONE_CLASSES: Readonly<Record<ChipTone, string>> = {
  neutral: "border-border bg-surface-2 text-fg-muted",
  accent: "border-transparent bg-accent-soft text-accent-text",
};

/** Small 6px-radius label for categories and tags. Purely presentational. */
export function Chip({ children, tone = "neutral", className }: ChipProps): ReactNode {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-chip border px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
