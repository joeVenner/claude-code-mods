import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { EventReferenceExplorer } from "@/components/docs/EventReferenceExplorer";
import { HookEventList } from "@/components/docs/HookEventList";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllExtensions } from "@/lib/catalog";
import { buildEventReference } from "@/lib/event-reference";
import { getEvents, getEventsSource } from "@/lib/events";
import { buildDocPageGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import { EVENT_FAMILIES, EVENT_FAMILY_LABELS } from "@/lib/types";

export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.hooks);

export default function HooksPage(): ReactNode {
  const source = getEventsSource();
  const events = getEvents();
  const { rows, otherNames } = buildEventReference(source, events, getAllExtensions());
  const familyCounts = EVENT_FAMILIES.map((family) => ({
    family,
    count: events.filter((event) => event.family === family).length,
  }));

  return (
    <DocPage
      title="Hook events"
      description="Every event Claude Code's function hooks name, and which entries in the directory list each one."
    >
      <JsonLd data={buildDocPageGraph(PAGE_SEO.hooks)} />
      <Callout>
        <p>
          Event names come from Anthropic&apos;s type declarations at commit <InlineCode>{source.sha.slice(0, 7)}</InlineCode>
          {source.claudeCodeVersion === null ? "" : ` (Claude Code ${source.claudeCodeVersion})`}, read on {source.syncedAt}.
          Which entries use an event is as each entry&apos;s listing names it, not checked against its code. Entries
          marked Community listing come from a third party and are not published by Anthropic. This page does not say
          what an event does: neither the catalog nor this list records that, so read the entry&apos;s page or the
          declarations before relying on an event.
        </p>
        <p>
          Mods are early access. Hooks modules load only where function hooks are enabled, and the API they are
          written against may change between releases without notice.
        </p>
      </Callout>
      <DocSection id="events" title="Every hook event">
        <Prose>
          <p>
            Function hooks name {events.length} events:{" "}
            {familyCounts.map(({ family, count }, index) => (
              <span key={family}>
                {index === 0 ? "" : index === familyCounts.length - 1 ? " and " : ", "}
                {count} {EVENT_FAMILY_LABELS[family].toLowerCase()}
              </span>
            ))}
            . A classic hook plugin lists a classic event by its plain name, such as <InlineCode>PreToolUse</InlineCode>;
            function hooks name the same event <InlineCode>classic.PreToolUse</InlineCode>. New to mods? Start with{" "}
            <TextLink href="/learn/">what a mod is</TextLink>.
          </p>
        </Prose>
        <EventReferenceExplorer rows={rows} />
      </DocSection>
      {otherNames.length === 0 ? null : (
        <DocSection id="other-names" title="Other names entries list">
          <Prose>
            <p>
              These names select none of the events above. A name can belong to a noun that a plugin adds to{" "}
              <InlineCode>$</InlineCode> itself, which is not in Anthropic&apos;s list, or be spelled differently from
              the declarations.
            </p>
          </Prose>
          <HookEventList
            rows={otherNames.map((other) => ({ event: other.name, entries: other.entries }))}
            emptyMessage="Every name an entry lists selects an event above."
          />
        </DocSection>
      )}
    </DocPage>
  );
}
