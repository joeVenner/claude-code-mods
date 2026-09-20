import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { DefinitionList } from "@/components/docs/DefinitionList";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import { Timeline } from "@/components/docs/Timeline";
import { buildPageMetadata } from "@/components/docs/pageMetadata";
import {
  BEFORE_YOU_INSTALL,
  NO_SCANNER_NOTICE,
  SCAN_PIPELINE,
  SECURITY_TIERS,
} from "@/components/docs/securityContent";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";

export const metadata: Metadata = buildPageMetadata({
  title: "Security",
  description:
    "What Source verified means today, the proposed security tier model (not implemented), and what to check before you install anything.",
  path: "/security/",
});

export default function SecurityPage(): ReactNode {
  return (
    <DocPage
      title="Security and verification"
      description="What the Source verified badge covers, what the proposed tier model would add, and what to check yourself."
    >
      <DocSection id="source-verified" title="What Source verified means today">
        <Prose>
          <p>
            A Source verified badge means one thing: the source URL on that entry responded with HTTP 200 on the date
            the entry shows. The check is <InlineCode>npm run catalog:verify</InlineCode>, which requests every URL in
            the catalog and reports any that do not respond.
          </p>
          <p>
            It does not read, scan or run any code. It says nothing about permissions, hooks, network calls, who
            maintains the project, or whether the description still matches the source after the check date.
          </p>
        </Prose>
        <Callout tone="warning">
          <p>Source verified is not a security review. It does not mean the code is safe or endorsed by anyone.</p>
        </Callout>
      </DocSection>

      <DocSection id="tier-model" title="Proposed security tiers">
        <Callout tone="warning">
          <p>{NO_SCANNER_NOTICE}</p>
          <p className="text-fg-muted">
            The model below comes from the marketplace architecture spec. It describes a registry and a scanner that
            have not been built. Every tier and every CLI behavior in this section is a proposal.
          </p>
        </Callout>

        <DefinitionList
          items={SECURITY_TIERS.map((tier) => ({
            id: tier.id,
            term: (
              <span className="flex flex-col gap-1">
                <span className={cn("font-mono text-sm", tier.id === "REVOKED" ? "text-danger" : "text-fg")}>
                  {tier.id}
                </span>
                <span className="text-fg-muted">{tier.name}</span>
              </span>
            ),
            description: (
              <>
                <p>{tier.criteria}</p>
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <Chip>Proposed CLI behavior</Chip>
                  <span className="text-fg">{tier.proposedBehavior}</span>
                </p>
              </>
            ),
          }))}
        />

        <div className="flex flex-col gap-6 pt-4">
          <h3 className="text-xl font-semibold tracking-tight text-fg">Proposed scan pipeline</h3>
          <Prose>
            <p>
              The spec sends every published package through four checks, in this order, before it is listed. None of
              them runs today.
            </p>
          </Prose>
          <Timeline items={SCAN_PIPELINE} label="Proposed scan pipeline" headingLevel="h4" />
        </div>
      </DocSection>

      <DocSection id="before-you-install" title="Before you install anything">
        <Prose>
          <p>
            Until something better exists, the checks are yours to make. They take a few minutes and apply to every
            extension, on this site or anywhere else.
          </p>
        </Prose>
        <ul className="grid gap-x-12 gap-y-8 md:grid-cols-2">
          {BEFORE_YOU_INSTALL.map((item) => (
            <li key={item.title} className="flex max-w-[65ch] flex-col gap-2 border-t border-border pt-4">
              <h3 className="text-lg font-semibold tracking-tight text-fg">{item.title}</h3>
              <p className="text-base leading-relaxed text-fg-muted">{item.body}</p>
            </li>
          ))}
        </ul>
        <Prose>
          <p>
            For how this site treats concepts and what it does and does not check, see{" "}
            <TextLink href="/about/">About</TextLink>.
          </p>
        </Prose>
      </DocSection>
    </DocPage>
  );
}
