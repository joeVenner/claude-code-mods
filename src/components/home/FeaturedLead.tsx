import type { ReactNode } from "react";
import { ExtensionCard } from "@/components/catalog/ExtensionCard";
import type { Extension } from "@/lib/types";

export interface FeaturedLeadProps {
  readonly extension: Extension;
}

/**
 * The large featured entry: the standard card plus the first paragraph of the listing's own
 * description, so the biggest tile says more than the small ones. Text comes straight from the
 * catalog and is rendered as plain text.
 */
export function FeaturedLead({ extension }: FeaturedLeadProps): ReactNode {
  const [firstParagraph] = extension.description;
  const hasHooks = extension.hooks.length > 0;

  return (
    <div className="flex h-full flex-col gap-3">
      <ExtensionCard extension={extension} className="flex-1" />
      <div className="flex flex-col gap-3 rounded-panel bg-surface-2 p-5">
        {firstParagraph ? <p className="text-sm leading-relaxed text-fg-muted">{firstParagraph}</p> : null}
        {hasHooks ? (
          <p className="font-mono text-xs leading-relaxed text-fg-muted">
            <span className="text-fg">Hooks:</span> {extension.hooks.join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
