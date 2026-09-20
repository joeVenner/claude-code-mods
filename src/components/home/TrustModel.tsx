import { ArrowRight, Check, Flask, ShieldWarning } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export interface TrustModelProps {
  /** Catalog generation date, YYYY-MM-DD, from `getCatalogGeneratedAt()`. */
  readonly catalogDate: string;
}

interface TrustColumn {
  readonly title: string;
  readonly icon: Icon;
  readonly body: ReactNode;
}

/**
 * Three plain-text columns separated by dividers. They are states, not features, so they
 * are not cards. The wording is deliberately blunt: scanning is specified but not built.
 */
export function TrustModel({ catalogDate }: TrustModelProps): ReactNode {
  const columns: readonly TrustColumn[] = [
    {
      title: "Source verified",
      icon: Check,
      body: (
        <>
          The source URL responded when the catalog was generated on <time dateTime={catalogDate}>{catalogDate}</time>.
          It shows the code exists and is public. It does not show the code is safe.
        </>
      ),
    },
    {
      title: "Concept",
      icon: Flask,
      body: "Proposed in the marketplace spec with no public code. Concepts have no install command, star count, or repository link.",
    },
    {
      title: "Not scanned yet",
      icon: ShieldWarning,
      body: "Automated tier scanning is specified but not built. No listing on this site has been scanned.",
    },
  ];

  return (
    <section aria-label="What listing labels mean" className="border-t border-border">
      <Container className="flex flex-col gap-10 py-16 md:py-20">
        <SectionHeading
          title="What the labels on a listing mean"
          body="Each listing carries a status. None of them is a security review."
        />

        <Reveal>
          <div className="grid divide-y divide-border border-y border-border md:grid-cols-[5fr_4fr_4fr] md:divide-x md:divide-y-0">
            {columns.map(({ title, icon: ColumnIcon, body }) => (
              <div key={title} className="flex flex-col gap-3 py-6 md:px-8 md:first:pl-0 md:last:pr-0">
                <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-fg">
                  <ColumnIcon size={20} weight="regular" aria-hidden="true" className="text-accent-text" />
                  {title}
                </h3>
                <p className="max-w-[46ch] text-sm leading-relaxed text-fg-muted">{body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="flex flex-col gap-10">
          <Button
            href="/security/"
            variant="ghost"
            className="self-start"
            iconRight={<ArrowRight size={16} weight="regular" aria-hidden="true" />}
          >
            Read the security model
          </Button>
          <div className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-medium tracking-tight text-fg">Maintain something for Claude Code?</p>
            <Button href="/publish/" size="lg" className="self-start sm:self-auto">
              Publish an extension
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
