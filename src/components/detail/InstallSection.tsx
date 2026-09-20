import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { TextLink } from "@/components/docs/TextLink";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { cn } from "@/lib/cn";
import type { Extension } from "@/lib/types";

export interface InstallSectionProps {
  readonly extension: Extension;
}

export const CONCEPT_NOT_INSTALLABLE =
  "Not installable. This is a proposed design from the marketplace spec with no public implementation.";
export const NO_INSTALL_COMMAND = "No install command listed. See the source repository.";

/**
 * Install commands come only from the catalog entry. When there are none, the reason is stated
 * instead of leaving an empty box, because an empty block reads as a rendering bug.
 */
export function InstallSection({ extension }: InstallSectionProps): ReactNode {
  const { installCommands, verification } = extension;
  const hasCommands = installCommands.length > 0;

  return (
    <section
      aria-labelledby="install-heading"
      // The panel only frames real commands; the explanatory callout below carries its own border.
      className={cn("flex flex-col gap-4", hasCommands && "rounded-panel border border-border bg-surface p-5")}
    >
      <h2 id="install-heading" className="text-lg font-semibold tracking-tight text-fg">
        Install
      </h2>
      {hasCommands ? (
        <>
          <div className="flex flex-col gap-3">
            {installCommands.map((command) => (
              <CopyCommand key={command} command={command} />
            ))}
          </div>
          <p className="text-sm leading-relaxed text-fg-muted">
            Read the source before you run these.{" "}
            <TextLink href="/security/#before-you-install">What to check first</TextLink>
          </p>
        </>
      ) : verification.status === "concept" ? (
        <Callout tone="note">
          <p>{CONCEPT_NOT_INSTALLABLE}</p>
          <p className="text-fg-muted">Spec reference: {verification.specReference}</p>
        </Callout>
      ) : (
        <Callout tone="note">
          <p>{NO_INSTALL_COMMAND}</p>
        </Callout>
      )}
    </section>
  );
}
