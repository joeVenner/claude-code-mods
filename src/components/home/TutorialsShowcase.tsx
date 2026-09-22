import { ArrowRight, Play } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { VIDEOS, VIDEO_GROUP_DURATIONS, videosInGroup } from "@/components/docs/tutorialsContent";
import { Button } from "@/components/ui/Button";

const CARD_REVEAL_STEP_SECONDS = 0.08;

/** Every basic video: together they tell the whole "what is a mod" story in under 4 minutes, and it is a real subset of VIDEOS, not a hand-picked one. */
const SHOWCASED_VIDEOS = videosInGroup("basic");

/**
 * One video card: its real poster image (played from the same GitHub attachment URL the tutorials
 * page uses, never re-hosted), a play affordance that appears on hover or focus, and the title and
 * duration below. The whole card is one link to that video's row on the tutorials page; nothing
 * plays inline here, so the home page never loads a `<video>` element.
 */
function TutorialCard({ video }: { readonly video: (typeof VIDEOS)[number] }): ReactNode {
  return (
    <Link
      href={`/learn/tutorials/#${video.id}`}
      className="group flex flex-col gap-3 rounded-panel outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="relative block aspect-video overflow-hidden rounded-control border border-control-border bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed remote poster, not a build-time asset Next's optimizer can reach */}
        <img
          src={video.posterUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-bg/0 transition-colors duration-200 group-hover:bg-bg/30">
          <span className="flex size-11 items-center justify-center rounded-full bg-bg/80 text-fg opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            <Play size={18} weight="fill" aria-hidden="true" />
          </span>
        </span>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-fg">{video.title}</span>
        <span className="text-sm text-fg-muted">{VIDEO_GROUP_DURATIONS[video.group]}</span>
      </span>
    </Link>
  );
}

/**
 * A teaser for the video tutorials: the 4 Basic videos as a grid of poster cards, each fading and
 * lifting into place as it scrolls into view (matching `FeaturedSection`'s staggered `Reveal`).
 * No video plays here and nothing autoplays or rotates on its own; the cards link to the full
 * tutorials page, where the actual `<video>` elements live.
 */
export function TutorialsShowcase(): ReactNode {
  return (
    <section aria-label="Video tutorials" className="border-t border-border">
      <Container className="flex flex-col gap-10 py-16 md:py-20">
        <SectionHeading
          title="See it in motion"
          body={`Anthropic's own ${VIDEOS.length} official videos on Claude Mods, straight from the announcement issue. These four cover the basics in about a minute each.`}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SHOWCASED_VIDEOS.map((video, index) => (
            <Reveal key={video.id} delay={index * CARD_REVEAL_STEP_SECONDS}>
              <TutorialCard video={video} />
            </Reveal>
          ))}
        </div>
        <Button href="/learn/tutorials/" variant="ghost" iconRight={<ArrowRight size={18} weight="regular" aria-hidden="true" />}>
          Watch all {VIDEOS.length} tutorials
        </Button>
      </Container>
    </section>
  );
}
