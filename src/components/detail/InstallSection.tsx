import type { ReactNode } from "react";
import { InlineLink } from "./InlineLink";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { cn } from "@/lib/cn";
import type { Extension } from "@/lib/types";
import { DetailCallout } from "./DetailCallout";

export interface InstallSectionProps {
  readonly extension: Pick<Extension, "availability" | "installCommands">;
}

export const NO_INSTALL_COMMAND = "No install command listed. See the source repository.";
/** Defines the availability label. Caveats such as early access come from the entry's own notice, shown above. */
export const BUILT_IN_EXPLANATION = "Built in. This ships inside Claude Code. Its source is published so you can read it.";

/**
 * What "getting it" means depends on availability. Install commands come only from the catalog
 * entry, and built-in or source-only entries get a plain statement instead of an empty box,
 * because an empty block reads as a rendering bug.
 */
export function InstallSection({ extension }: InstallSectionProps): ReactNode {
  const { availability, installCommands } = extension;
  const isInstallable = availability === "installable" && installCommands.length > 0;

  return (
    <section
      aria-labelledby="install-heading"
      // The panel only frames real commands; the callout below carries its own border.
      className={cn("flex flex-col gap-4", isInstallable && "rounded-panel border border-border bg-surface p-5")}
    >
      <h2 id="install-heading" className="text-lg font-semibold tracking-tight text-fg">
        Install
      </h2>
      {isInstallable ? (
        <>
          <div className="flex flex-col gap-3">
            {installCommands.map((command) => (
              <CopyCommand key={command} command={command} />
            ))}
          </div>
          <p className="text-sm leading-relaxed text-fg-muted">
            Read the source before you run these.{" "}
            <InlineLink href="/security/#before-you-install">What to check first</InlineLink>
          </p>
        </>
      ) : (
        <DetailCallout tone="note">
          <p>{availability === "built-in" ? BUILT_IN_EXPLANATION : NO_INSTALL_COMMAND}</p>
        </DetailCallout>
      )}
    </section>
  );
}
