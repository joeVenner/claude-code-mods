import type { ReactNode } from "react";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import { VIDEO_GROUP_DURATIONS, type Video } from "@/components/docs/tutorialsContent";

export interface VideoCardProps {
  readonly video: Video;
  readonly number: number;
  /** Where the event this video names links to on the Hooks page, or null when it names none, or a wildcard, which stays text. */
  readonly eventHref: string | null;
}

/**
 * One official video: the clip itself (played from Anthropic's own attachment URL, never re-hosted),
 * its caption quoted exactly, and a link back to it in context on the announcement issue.
 */
export function VideoCard({ video, number, eventHref }: VideoCardProps): ReactNode {
  const headingId = `${video.id}-title`;
  return (
    <figure id={video.id} className="scroll-mt-20 flex flex-col gap-3 rounded-panel border border-border p-4 md:p-5">
      <figcaption>
        <h3 id={headingId} className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-fg">
          <span className="font-mono text-sm font-normal text-fg-muted">{number}</span>
          {video.title}
        </h3>
      </figcaption>
      {/* No captions or transcript exist for these clips (see the callout above); controls are never hidden and nothing autoplays. */}
      <video
        controls
        preload="none"
        poster={video.posterUrl}
        aria-labelledby={headingId}
        className="w-full rounded-control border border-control-border bg-surface-2"
      >
        <source src={video.videoUrl} type="video/mp4" />
        <TextLink href={video.videoUrl}>Download the clip</TextLink>, your browser cannot play it inline.
      </video>
      <blockquote className="border-l-2 border-border-strong pl-4 text-sm leading-relaxed text-fg-muted">
        &ldquo;{video.caption}&rdquo;
      </blockquote>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
        <span>{VIDEO_GROUP_DURATIONS[video.group]}</span>
        {video.eventNamed === null ? null : eventHref === null ? (
          <InlineCode>{video.eventNamed}</InlineCode>
        ) : (
          <TextLink href={eventHref}>
            <InlineCode>{video.eventNamed}</InlineCode>
          </TextLink>
        )}
        <TextLink href={video.videoUrl}>Watch on GitHub</TextLink>
      </p>
    </figure>
  );
}

