import Link from "next/link";
import type { ReactNode } from "react";
import { extensionHref } from "@/components/catalog/ExtensionCard";
import { KindIcon } from "@/components/catalog/KindIcon";
import { Container } from "@/components/ui/Container";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { KIND_LABELS } from "@/lib/types";
import type { Extension } from "@/lib/types";
import { githubRepositoryName, leadSentences } from "./home-data";
import type { RunFromSourceExample } from "./home-data";

export interface InstallFlowProps {
  /** Installable listings that have install commands, chosen by `pickInstallExamples`. May be empty. */
  readonly examples: readonly Extension[];
  /** A mod's stored "Run from source" command, from `pickRunFromSource`. Null when no entry lists one. */
  readonly runFromSource?: RunFromSourceExample | null;
}

/**
 * What the command needs, from the entry itself: the repository comes from its own URL and the
 * caveat is the opening sentence of its own notice. Nothing here is written by hand, so an entry
 * without a notice gets no caveat.
 */
function describeRunFromSourcePrerequisite(extension: Extension): string {
  const repositoryName = githubRepositoryName(extension.repositoryUrl);
  const repository = repositoryName ?? "the source repository";
  const caveat = extension.notice === null ? null : leadSentences(extension.notice, 1);
  return caveat === null ? `Needs a clone of ${repository}.` : `Needs a clone of ${repository}. ${caveat}`;
}

function RunFromSourceBlock({
  example,
  hasDivider,
}: {
  readonly example: RunFromSourceExample;
  readonly hasDivider: boolean;
}): ReactNode {
  const { extension, command } = example;
  return (
    <div
      role="group"
      aria-labelledby="run-from-source-heading"
      className={cn("flex flex-col gap-3", hasDivider && "border-t border-border pt-6")}
    >
      <h3 id="run-from-source-heading" className="text-base font-semibold tracking-tight text-fg">
        Read a mod running from source
      </h3>
      <p className="max-w-[52ch] text-sm leading-relaxed text-fg-muted">
        {describeRunFromSourcePrerequisite(extension)}
      </p>
      <CopyCommand command={command} copyLabel={`Run ${extension.name} from source`} />
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
    </div>
  );
}

/**
 * Copy on the left, real commands on the right. Every command is copied verbatim from a catalog
 * entry (`installCommands`, or a mod's stored "Run from source" detail); this component never
 * composes command syntax itself.
 */
export function InstallFlow({ examples, runFromSource = null }: InstallFlowProps): ReactNode {
  const hasExamples = examples.length > 0;
  const hasAnyCommand = hasExamples || runFromSource !== null;

  return (
    <section aria-label="Installing an extension" className="border-y border-border bg-surface">
      <Container className="grid grid-cols-1 gap-10 py-16 md:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-16">
        <SectionHeading
          title="Commands come from each listing"
          body="Every command here is copied from the listing it belongs to. A listing does not mean the code was reviewed, so read the source before you run anything."
        />
        <Reveal>
          {hasAnyCommand ? (
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
              {runFromSource !== null ? <RunFromSourceBlock example={runFromSource} hasDivider={hasExamples} /> : null}
            </div>
          ) : (
            <EmptyState
              title="No copyable commands yet"
              body="No listing publishes a command we could show here. Open a listing to see how its source says to use it."
            />
          )}
        </Reveal>
      </Container>
    </section>
  );
}
