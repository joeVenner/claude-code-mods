import { ArrowRight } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { ComparisonTable } from "@/components/docs/ComparisonTable";
import { DefinitionList } from "@/components/docs/DefinitionList";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import {
  CONCEPTS,
  KIND_COMPARISON,
  KIND_COMPARISON_COLUMNS,
  LEARN_SOURCES,
} from "@/components/docs/learnContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/Button";
import { getEvents, getEventsSource } from "@/lib/events";
import { buildDocPageGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import { EVENT_FAMILIES, type EventFamily } from "@/lib/types";

export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.learn);

function countByFamily(family: EventFamily): number {
  return getEvents().filter((event) => event.family === family).length;
}

export default function LearnPage(): ReactNode {
  const source = getEventsSource();
  const [engineCount, opCount, classicCount] = EVENT_FAMILIES.map(countByFamily);

  return (
    <DocPage
      title="Learn Claude Mods"
      description="What a Claude Mod is, how function hooks work, and how a mod differs from the other ways to extend Claude Code."
    >
      <JsonLd data={buildDocPageGraph(PAGE_SEO.learn)} />
      <Callout>
        <p>
          Claude Mods are early access. Anthropic says the API a mod is written against may change between releases
          without notice, and hooks modules load only where function hooks are enabled. This site is unofficial: the
          sources are linked beside each idea and in the table, so you can check them.
        </p>
      </Callout>
      <div className="flex flex-wrap items-center gap-3">
        <Button href="/learn/tutorials/" size="lg" iconRight={<ArrowRight size={18} weight="regular" aria-hidden="true" />}>
          Watch the video tutorials
        </Button>
        <Button href="/learn/getting-started/" variant="ghost" size="lg">
          Build your first mod
        </Button>
      </div>
      <DocSection id="what-is-a-mod" title="What is a Claude Mod?">
        <Prose>
          <p>
            A mod is a Claude Code plugin whose behaviour lives in a hooks module: one <InlineCode>register</InlineCode>{" "}
            entry that hooks the engine&apos;s events with TypeScript functions shaped{" "}
            <InlineCode>($, e, next)</InlineCode>. The announcement puts it this way: a mod is just a plugin that uses
            function hooks, and function hooks are the documented primitive that mods are built on.
          </p>
          <p>
            Anthropic ships four mods inside Claude Code and publishes their source. Read them in the{" "}
            <TextLink href="/browse/?kind=mod">directory</TextLink>, in the{" "}
            <TextLink href={LEARN_SOURCES.modsReadme}>Mods README</TextLink>, or in the{" "}
            <TextLink href={LEARN_SOURCES.announcementIssue}>announcement issue</TextLink>.
          </p>
        </Prose>
      </DocSection>
      <DocSection id="how-it-works" title="How function hooks work">
        <DefinitionList
          items={CONCEPTS.map((concept) => ({
            id: concept.id,
            term: concept.term,
            description: (
              <>
                <p>{concept.description}</p>
                <p className="text-sm">
                  Source:{" "}
                  {concept.sources.map((source, index) => (
                    <span key={source.href}>
                      {index === 0 ? "" : ", "}
                      <TextLink href={source.href}>{source.label}</TextLink>
                    </span>
                  ))}
                </p>
              </>
            ),
          }))}
        />
      </DocSection>
      <DocSection id="compared" title="Mods compared with the rest">
        <Prose>
          <p>
            Claude Code can be extended in {KIND_COMPARISON.length - 1} other ways. They overlap, and a plugin can package
            several of them. A mod is the only one that hooks the engine&apos;s own events as functions.
          </p>
        </Prose>
        <ComparisonTable
          caption="Mods compared with plugins, classic hooks, MCP servers and skills"
          columns={KIND_COMPARISON_COLUMNS}
          rows={KIND_COMPARISON.map((kind) => ({
            id: kind.id,
            header: kind.name,
            cells: [
              kind.whatItIs,
              kind.howYouWriteIt,
              kind.whatItCanDo,
              <TextLink key="source" href={kind.source.href}>
                {kind.source.label}
              </TextLink>,
            ],
          }))}
        />
      </DocSection>
      <DocSection id="events" title="What a mod can hook">
        <Prose>
          <p>
            Function hooks name {getEvents().length} events: {engineCount} engine events, {opCount} calls on{" "}
            <InlineCode>$</InlineCode> and {classicCount} classic hooks bridged in as{" "}
            <InlineCode>classic.&lt;Name&gt;</InlineCode>. The names were read from Anthropic&apos;s type declarations
            at commit <InlineCode>{source.sha.slice(0, 7)}</InlineCode>
            {source.claudeCodeVersion === null ? "" : ` (Claude Code ${source.claudeCodeVersion})`} on {source.syncedAt}.
            The <TextLink href="/hooks/">Hooks page</TextLink> shows which mods and plugins use which events.
          </p>
        </Prose>
      </DocSection>
      <DocSection id="next" title="Where to go next">
        <Prose>
          <p>
            Build a small mod in the <TextLink href="/learn/getting-started/">Getting started guide</TextLink>, move a
            hook you already have with <TextLink href="/learn/migration/">classic hooks to function hooks</TextLink>, or
            watch the <TextLink href="/learn/tutorials/">official video tutorials</TextLink>. To share a mod you have
            built, see how to <TextLink href="/publish/">publish it</TextLink>, and read{" "}
            <TextLink href="/security/">what this site does and does not check</TextLink> and{" "}
            <TextLink href="/security/#mod-runtime">how Claude Code keeps a mod in check</TextLink> first.
          </p>
        </Prose>
      </DocSection>
    </DocPage>
  );
}
