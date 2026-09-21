import type { ReactNode } from "react";
import { Chip } from "@/components/ui/Chip";
import { AVAILABILITY_LABELS } from "@/lib/types";
import type { Availability } from "@/lib/types";

export interface AvailabilityChipProps {
  readonly availability: Availability;
  readonly className?: string;
}

/** How a reader gets the entry: installable, built into Claude Code, or source only. */
export function AvailabilityChip({ availability, className }: AvailabilityChipProps): ReactNode {
  return <Chip className={className}>{AVAILABILITY_LABELS[availability]}</Chip>;
}
