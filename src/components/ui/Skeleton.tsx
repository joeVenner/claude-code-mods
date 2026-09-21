import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SkeletonProps {
  /** Size the placeholder to match the final content, for example `h-4 w-40`. */
  readonly className?: string;
}

/** Loading placeholder. Hidden from assistive tech; announce loading state at the container level. */
export function Skeleton({ className }: SkeletonProps): ReactNode {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-chip bg-surface-2", className)} />;
}
