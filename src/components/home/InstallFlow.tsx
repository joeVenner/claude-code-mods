import Link from "next/link";
import type { ReactNode } from "react";
import { extensionHref } from "@/components/catalog/ExtensionCard";
import { KindIcon } from "@/components/catalog/KindIcon";
import { Container } from "@/components/ui/Container";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { KIND_LABELS } from "@/lib/types";
import type { Extension } from "@/lib/types";

export interface InstallFlowProps {
  /** Verified listings that have install commands, chosen by `pickInstallExamples`. May be empty. */
  readonly examples: readonly Extension[];
}

/**
 * Copy on the left, real commands on the right. Every command is copied verbatim from a
 * catalog entry's `installCommands`; this component never composes install syntax itself.
 */
export function InstallFlow({ examples }: InstallFlowProps): ReactNode {
  return (
    <section aria-label="Installing an extension" className="border-y border-border bg-surface">
      <Container className="grid grid-cols-1 gap-10 py-16 md:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-16">
        <SectionHeading
          title="Install commands come from each listing"
          body="Every command here is copied from the listing it belongs to. A listing does not mean the code was reviewed, so read the source before you run anything."
        />
        <Reveal>
          {examples.length > 0 ? (
            <div className="flex flex-col gap-6">
              {examples.map((extension) => (
                <div
                  key={extension.slug}
                  role="group"
                  aria-label={`Install commands for ${extension.name}`}
                  className="flex flex-col gap-3"
                >
                  <p className="flex items-center gap-2 text-sm">
                    <KindIcon kind={extension.kind} size={16} className="text-fg-muted" />
                    <Link
                      href={extensionHref(extension.slug)}
                      className="rounded-control font-medium text-fg underline decoration-border-strong underline-offset-4 hover:decoration-fg"
                    >
                      {extension.name}
                    </Link>
                    <span className="font-mono text-xs text-fg-muted">{KIND_LABELS[extension.kind]}</span>
                  </p>
                  {extension.installCommands.map((command) => (
                    <CopyCommand key={command} command={command} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No copyable commands yet"
              body="None of the featured entries publish an install command we could show here. Open a listing to see how its source says to install it."
            />
          )}
        </Reveal>
      </Container>
    </section>
  );
}
