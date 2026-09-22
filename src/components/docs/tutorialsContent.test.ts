import { describe, expect, it } from "vitest";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import { getEvents } from "@/lib/events";
import { patternMatchesEvent } from "@/lib/event-names";
import { ALLOWED_CATALOG_HOSTS } from "@/lib/url";
import {
  ANNOUNCEMENT_ISSUE_URL,
  NOT_RE_HOSTED_NOTE,
  NO_CAPTIONS_NOTE,
  VIDEOS,
  VIDEO_GROUP_DURATIONS,
  VIDEO_GROUP_LABELS,
  VIDEO_HOSTS,
  videosInGroup,
} from "./tutorialsContent";

describe("VIDEOS", () => {
  it("has exactly the 9 official videos, unique ids, in a fixed order 1 to 9", () => {
    expect(VIDEOS).toHaveLength(9);
    expect(new Set(VIDEOS.map((video) => video.id)).size).toBe(9);
    expect(VIDEOS.map((video) => video.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("groups them 4 Basic, 3 Advanced, 2 Case studies, matching the issue's own grouping", () => {
    expect(videosInGroup("basic")).toHaveLength(4);
    expect(videosInGroup("advanced")).toHaveLength(3);
    expect(videosInGroup("case-study")).toHaveLength(2);
  });

  it("keeps every video's order within its own group ascending", () => {
    for (const group of ["basic", "advanced", "case-study"] as const) {
      const orders = videosInGroup(group).map((video) => video.order);
      expect(orders, group).toEqual([...orders].sort((left, right) => left - right));
    }
  });

  it("gives every video a non-empty title and caption, with no em or en dash", () => {
    for (const video of VIDEOS) {
      expect(video.title.trim(), video.id).not.toBe("");
      expect(video.caption.trim(), video.id).not.toBe("");
      expect(video.title, video.id).not.toMatch(DASH_PATTERN);
      expect(video.caption, video.id).not.toMatch(DASH_PATTERN);
    }
  });

  it("points every video and poster at the stable github.com front door, never the S3 redirect target directly", () => {
    for (const video of VIDEOS) {
      expect(video.videoUrl.startsWith(`https://${VIDEO_HOSTS.frontDoor}/user-attachments/assets/`), video.id).toBe(true);
      expect(video.posterUrl.startsWith(`https://${VIDEO_HOSTS.frontDoor}/user-attachments/assets/`), video.id).toBe(true);
      expect(video.videoUrl, video.id).not.toContain(VIDEO_HOSTS.redirectTarget);
    }
  });

  it("gives every video a different video asset id and a different poster asset id", () => {
    expect(new Set(VIDEOS.map((video) => video.videoUrl)).size).toBe(VIDEOS.length);
    expect(new Set(VIDEOS.map((video) => video.posterUrl)).size).toBe(VIDEOS.length);
  });

  it("names an event only when the video's own caption literally names it, and that event or pattern is real", () => {
    const events = getEvents();
    const named = VIDEOS.filter((video) => video.eventNamed !== null);
    expect(named.map((video) => video.id)).toEqual(["press-a-plugins-button", "every-event-at-once"]);
    for (const video of named) {
      const eventNamed = video.eventNamed as string;
      expect(video.caption, video.id).toContain(eventNamed === "*" ? "*" : eventNamed);
      expect(patternMatchesEvent(eventNamed, events, true), video.id).toBe(true);
    }
  });

  it("does not claim an event or pattern for a caption that does not name one", () => {
    for (const video of VIDEOS.filter((candidate) => candidate.eventNamed === null)) {
      // None of the un-named captions happen to contain a real dotted event name or the bare wildcard.
      expect(getEvents().every((event) => !video.caption.includes(event.name)), video.id).toBe(true);
    }
  });
});

describe("VIDEO_GROUP_LABELS and VIDEO_GROUP_DURATIONS", () => {
  it("has a label and a duration for every group", () => {
    for (const group of ["basic", "advanced", "case-study"] as const) {
      expect(VIDEO_GROUP_LABELS[group].trim()).not.toBe("");
      expect(VIDEO_GROUP_DURATIONS[group].trim()).not.toBe("");
    }
  });

  it("states an exact duration only for Basic and Advanced, and an approximate one for Case studies", () => {
    expect(VIDEO_GROUP_DURATIONS.basic).toBe("60 seconds");
    expect(VIDEO_GROUP_DURATIONS.advanced).toBe("60 seconds");
    expect(VIDEO_GROUP_DURATIONS["case-study"]).toMatch(/^around /);
  });
});

describe("ANNOUNCEMENT_ISSUE_URL and the honesty notes", () => {
  it("is an https link on a host this site already trusts", () => {
    const url = new URL(ANNOUNCEMENT_ISSUE_URL);
    expect(url.protocol).toBe("https:");
    expect(ALLOWED_CATALOG_HOSTS as readonly string[]).toContain(url.hostname);
  });

  it("says nothing is re-hosted and that no captions exist", () => {
    expect(NOT_RE_HOSTED_NOTE).toMatch(/Nothing is copied to this site/);
    expect(NO_CAPTIONS_NOTE).toMatch(/No captions or transcripts are available/);
    expect(NOT_RE_HOSTED_NOTE).not.toMatch(DASH_PATTERN);
    expect(NO_CAPTIONS_NOTE).not.toMatch(DASH_PATTERN);
  });
});

describe("videosInGroup", () => {
  it("returns an empty list for no matches without failing", () => {
    // @ts-expect-error deliberately passing a group that does not exist, to check the filter degrades safely
    expect(videosInGroup("nonexistent")).toEqual([]);
  });
});
