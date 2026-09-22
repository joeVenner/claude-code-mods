import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { TextLink } from "@/components/docs/TextLink";
import {
  ANNOUNCEMENT_ISSUE_URL,
  NOT_RE_HOSTED_NOTE,
  NO_CAPTIONS_NOTE,
  VIDEOS,
  VIDEO_GROUP_LABELS,
  videosInGroup,
  type VideoGroup,
} from "@/components/docs/tutorialsContent";
import { VideoCard } from "@/components/docs/VideoCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { eventAnchorId, eventNamedBy } from "@/lib/event-names";
import { getEvents } from "@/lib/events";
import { buildTutorialsGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.learnTutorials);

const GROUP_ORDER: readonly VideoGroup[] = ["basic", "advanced", "case-study"];

function hooksRowHref(eventName: string): string {
  return `${PAGE_SEO.hooks.path}#${eventAnchorId(eventName)}`;
}

export default function TutorialsPage(): ReactNode {
  const events = getEvents();

  return (
    <DocPage
      title="Claude Mods video tutorials"
      description="The 9 official videos from the announcement issue, played from Anthropic's own attachment URLs."
    >
      <JsonLd data={buildTutorialsGraph(VIDEOS)} />
      <Callout>
        <p>{NOT_RE_HOSTED_NOTE}</p>
        <p>{NO_CAPTIONS_NOTE}</p>
        <p>
          Every caption below is quoted exactly from the{" "}
          <TextLink href={ANNOUNCEMENT_ISSUE_URL}>announcement issue</TextLink>. Function hooks are early access, and
          what a video shows may have changed since it was made.
        </p>
      </Callout>
      {GROUP_ORDER.map((group) => (
        <DocSection key={group} id={group} title={VIDEO_GROUP_LABELS[group]}>
          <div className="grid gap-6 md:grid-cols-2">
            {videosInGroup(group).map((video) => {
              const namedEvent = video.eventNamed === null ? null : eventNamedBy(video.eventNamed, events, true);
              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  number={video.order}
                  eventHref={namedEvent === null ? null : hooksRowHref(namedEvent.name)}
                />
              );
            })}
          </div>
        </DocSection>
      ))}
      <DocSection id="next" title="Where to go next">
        <Prose>
          <p>
            Build a small mod in the <TextLink href="/learn/getting-started/">Getting started guide</TextLink>, or look
            up any event a video mentions on the <TextLink href="/hooks/">Hooks page</TextLink>.
          </p>
        </Prose>
      </DocSection>
    </DocPage>
  );
}
