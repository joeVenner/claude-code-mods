import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { HookEventList } from "@/components/docs/HookEventList";
import { TextLink } from "@/components/docs/TextLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllExtensions } from "@/lib/catalog";
import { buildHooksIndex } from "@/lib/hooks-index";
import { buildDocPageGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.hooks);

export default function HooksPage(): ReactNode {
  const { functionHooks, classicHooks } = buildHooksIndex(getAllExtensions());

  return (
    <DocPage
      title="Hook events"
      description="Which entries in the directory listen to which hook event, split into the two hook systems."
    >
      <JsonLd data={buildDocPageGraph(PAGE_SEO.hooks)} />
      <Callout>
        <p>
          Event names below are as each entry&apos;s listing names them, not checked against its code. Entries marked
          Community listing come from a third party and are not published by Anthropic. This page does not say what an
          event does, because the catalog does not record it. Read the entry&apos;s page or its source before relying
          on an event.
        </p>
        <p>
          Entries are grouped by their kind: mods under function hooks, every other kind under classic hooks. The
          catalog does not record which hook system an event belongs to.
        </p>
      </Callout>
      <DocSection id="function-hooks" title="Function hooks, used by mods">
        <Prose>
          <p>
            A mod is a Claude Code plugin whose behaviour lives in a hooks module. Anthropic&apos;s mods are early
            access: hooks modules load only where function hooks are enabled, and the API they are written against may
            change between releases without notice. They ship inside Claude Code; see the{" "}
            <TextLink href="/browse/?kind=mod">mods in the directory</TextLink> for how to download and test each one.
          </p>
        </Prose>
        <HookEventList rows={functionHooks} emptyMessage="No mod in the directory lists a function hook yet." />
      </DocSection>
      <DocSection id="classic-hooks" title="Classic hooks, used by everything else">
        <Prose>
          <p>
            Entries that are not mods are grouped here.
          </p>
        </Prose>
        <HookEventList rows={classicHooks} emptyMessage="No other entry in the directory lists a classic hook yet." />
      </DocSection>
    </DocPage>
  );
}
