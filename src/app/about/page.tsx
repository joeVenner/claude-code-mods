import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { DefinitionList } from "@/components/docs/DefinitionList";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import { buildPageMetadata } from "@/components/docs/pageMetadata";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { DISCLAIMER } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description:
    "What this directory is, where its data comes from, how concepts differ from verified entries, and how to re-check the links.",
  path: "/about/",
});

export default function AboutPage(): ReactNode {
  const extensions = getAllExtensions();
  const verifiedCount = extensions.filter((extension) => extension.verification.status === "verified").length;
  const conceptCount = extensions.length - verifiedCount;
  const generatedAt = getCatalogGeneratedAt();

  return (
    <DocPage
      title="About this directory"
      description="A community-run list of Claude Code plugins, skills, agents, hooks, MCP servers and commands, with a plain record of what was checked."
    >
      <DocSection id="unofficial" title="Unofficial, and not a security service">
        <Callout tone="note">
          <p>{DISCLAIMER}</p>
        </Callout>
        <Prose>
          <p>
            This site does not host, package or run any extension. Each entry points to the publisher&apos;s own
            source. Listing something here is not an endorsement, and it is not a safety claim.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="data" title="Where the data comes from">
        <Prose>
          <p>
            Every entry lives in one data file, <InlineCode>src/data/catalog.json</InlineCode>, and is validated against
            a schema when the site builds. The catalog was generated on{" "}
            <time dateTime={generatedAt}>{generatedAt}</time> and currently holds {extensions.length} entries:{" "}
            {verifiedCount} with a verified source and {conceptCount} concepts.
          </p>
          <p>
            Descriptions, publishers, licenses and install commands were written from the source pages linked on each
            entry. Star counts, where shown, carry the date they were captured. There are no download counts because no
            registry exists to measure them.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="concepts" title="Concepts and verified entries">
        <DefinitionList
          items={[
            {
              id: "verified",
              term: "Source verified",
              description: (
                <p>
                  A public source exists and its URL responded with HTTP 200 on the date shown on the entry. It can
                  have an install command, a repository link and a star count. It has not been security reviewed.
                </p>
              ),
            },
            {
              id: "concept",
              term: "Concept",
              description: (
                <p>
                  An idea described in the marketplace spec with no public implementation. It has no install command,
                  no repository link, no stars and no verified badge. It is listed so the ideas are visible, not
                  because you can use them.
                </p>
              ),
            },
          ]}
        />
        <Prose>
          <p>
            The specification named public repositories for these ideas. None of them resolved on {getCatalogGeneratedAt()},
            so they are listed as concepts.
          </p>
          <p>
            The same reports describe a mods runtime for Claude Code. We could not confirm that it exists, so no page
            here presents it as a shipping feature. For the tier model that the reports also propose, see{" "}
            <TextLink href="/security/">Security</TextLink>.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="re-verify" title="Check the links yourself">
        <Prose>
          <p>
            The verification check is a script in the repository. It requests every URL in the catalog and exits with an
            error if any of them does not respond with HTTP 200.
          </p>
        </Prose>
        <CopyCommand command="npm run catalog:verify" className="max-w-[65ch]" />
        <Prose>
          <p>
            A passing run only repeats the claim the badge already makes. To decide whether something is safe to
            install, follow{" "}
            <TextLink href="/security/#before-you-install">the checks on the Security page</TextLink>.
          </p>
        </Prose>
      </DocSection>
    </DocPage>
  );
}
