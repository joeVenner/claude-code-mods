import type { ReactNode } from "react";
import type { Extension } from "@/lib/types";

export interface StarCountProps {
  readonly stars: Extension["stars"];
  readonly className?: string;
}

/** Fixed locale keeps the server-rendered text identical to any client re-render. */
export function formatStarLabel(count: number): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "star" : "stars"}`;
}

/** Renders nothing unless a real count exists; the capture date is exposed as a tooltip. */
export function StarCount({ stars, className }: StarCountProps): ReactNode {
  if (stars === null) return null;
  return (
    <span className={className} title={`Captured ${stars.capturedAt}`}>
      {formatStarLabel(stars.count)}
    </span>
  );
}
