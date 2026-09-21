import type { ReactNode } from "react";
import { CopyCommand } from "@/components/ui/CopyCommand";
import type { Detail } from "@/lib/types";

export interface DetailsListProps {
  readonly details: readonly Detail[];
}

/** Labelled facts from the entry. Values that are commands become copy rows; the rest stay text. */
export function DetailsList({ details }: DetailsListProps): ReactNode {
  if (details.length === 0) return null;
  return (
    <section aria-labelledby="details-heading" className="flex flex-col gap-3">
      <h2 id="details-heading" className="text-base font-semibold text-fg">
        Details
      </h2>
      <dl className="flex flex-col divide-y divide-border">
        {details.map((detail) => (
          <div key={`${detail.label}:${detail.value}`} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
            <dt className="text-xs text-fg-muted">{detail.label}</dt>
            <dd className="text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">
              {detail.isCommand ? (
                <CopyCommand command={detail.value} copyLabel={detail.label} />
              ) : (
                detail.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
