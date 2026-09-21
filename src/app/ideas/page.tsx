import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { IdeaList } from "@/components/docs/IdeaList";
import { TextLink } from "@/components/docs/TextLink";
import { buildPageMetadata } from "@/components/docs/pageMetadata";
import { Button } from "@/components/ui/Button";
import { getIdeas, getIdeasCheckedAt } from "@/lib/ideas";

export const metadata: Metadata = buildPageMetadata({
  title: "Proposed ideas",
  description:
    "Mods proposed in the marketplace spec that have no public implementation. They cannot be installed and are not in the directory.",
  path: "/ideas/",
});

export default function IdeasPage(): ReactNode {
  const ideas = getIdeas();
  const checkedOn = getIdeasCheckedAt();

  return (
    <DocPage
      title="Proposed ideas"
      description="Mods described in the marketplace spec. Nobody has published them, so you cannot install any of these."
    >
      <Callout tone="warning">
        <p>
          These are proposals with no public implementation. They are not in the directory, its counts or its search.
        </p>
        <p>
          The event names are quoted from the spec and may not match the dotted names the real engine uses. For real
          names, read the mods that ship in Claude Code: <TextLink href="/browse/?kind=mod">browse the mods</TextLink>.
        </p>
        <p>
          The repositories the spec named did not resolve on <time dateTime={checkedOn}>{checkedOn}</time>.
        </p>
      </Callout>

      <IdeaList ideas={ideas} />

      <DocSection id="build-one" title="Want one of these to exist?">
        <Prose>
          <p>
            If you build one, list it by pull request. It joins the directory as a real entry once its source is
            public.
          </p>
        </Prose>
        <div>
          <Button href="/publish/" size="lg">
            Publish an extension
          </Button>
        </div>
      </DocSection>
    </DocPage>
  );
}
