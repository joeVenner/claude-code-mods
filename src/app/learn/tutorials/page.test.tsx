import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import {
  ANNOUNCEMENT_ISSUE_URL,
  NOT_RE_HOSTED_NOTE,
  NO_CAPTIONS_NOTE,
  VIDEOS,
  VIDEO_GROUP_LABELS,
  videosInGroup,
} from "@/components/docs/tutorialsContent";
import { PAGE_SEO } from "@/lib/seo/pages";
import { SITE_URL } from "@/lib/site";
import TutorialsPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("tutorials page", () => {
  it("has exactly one h1, ordered headings and no em or en dashes", () => {
    const { container } = render(<TutorialsPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)));
    levels.slice(1).forEach((level, index) => {
      expect(level - levels[index]).toBeLessThanOrEqual(1);
    });
  });

  it("says nothing is re-hosted and that no captions exist, before showing any video", () => {
    render(<TutorialsPage />);
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(NOT_RE_HOSTED_NOTE);
    expect(note).toHaveTextContent(NO_CAPTIONS_NOTE);
    expect(note).toHaveTextContent(/early access/);
    expect(within(note).getByRole("link", { name: /announcement issue/ })).toHaveAttribute("href", ANNOUNCEMENT_ISSUE_URL);
  });

  it("renders all 9 videos, each with its own video element playing its exact source", () => {
    const { container } = render(<TutorialsPage />);
    const videos = container.querySelectorAll("video");
    expect(videos).toHaveLength(9);
    for (const video of VIDEOS) {
      const element = container.querySelector(`#${video.id} video source`);
      expect(element, video.id).not.toBeNull();
      expect(element).toHaveAttribute("src", video.videoUrl);
    }
  });

  it("groups the videos Basic, Advanced, then Case studies, each under its own heading", () => {
    render(<TutorialsPage />);
    const headingOrder = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(headingOrder).toEqual([
      VIDEO_GROUP_LABELS.basic,
      VIDEO_GROUP_LABELS.advanced,
      VIDEO_GROUP_LABELS["case-study"],
      "Where to go next",
    ]);
    for (const group of ["basic", "advanced", "case-study"] as const) {
      const section = document.getElementById(group) as HTMLElement;
      const titlesInSection = within(section)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent?.replace(/^\d+/, "").trim());
      expect(titlesInSection).toEqual(videosInGroup(group).map((video) => video.title));
    }
  });

  it("links the one video that names a real event to its Hooks page row", () => {
    render(<TutorialsPage />);
    const link = screen.getByRole("link", { name: "ui.press" });
    expect(link.getAttribute("href")).toMatch(/^\/hooks\/?#event-ui\.press$/);
  });

  it("shows the wildcard-naming video's pattern as text, never as a link", () => {
    render(<TutorialsPage />);
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "*" })).not.toBeInTheDocument();
  });

  it("quotes every caption exactly, once each", () => {
    const { container } = render(<TutorialsPage />);
    for (const video of VIDEOS) {
      expect(container.textContent, video.id).toContain(video.caption);
    }
  });

  it("links on to getting started and the Hooks page", () => {
    render(<TutorialsPage />);
    expect(screen.getByRole("link", { name: "Getting started guide" }).getAttribute("href")).toMatch(/^\/learn\/getting-started\/?$/);
    expect(screen.getByRole("link", { name: "Hooks page" }).getAttribute("href")).toMatch(/^\/hooks\/?$/);
  });

  it("does not claim the videos were reviewed, scanned or re-hosted", () => {
    const { container } = render(<TutorialsPage />);
    expect(container.textContent).not.toMatch(/\b(reviewed|scanned|audited)\b/i);
    expect(container.textContent).not.toMatch(/\bre-hosted on\b/i);
  });

  it("has its own canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${PAGE_SEO.learnTutorials.path}`);
  });

  it("embeds one parseable JSON-LD graph with a VideoObject per video", () => {
    const { container } = render(<TutorialsPage />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const graph = JSON.parse(scripts[0].textContent ?? "") as { "@graph": { "@type": string }[] };
    const videoNodes = graph["@graph"].filter((node) => node["@type"] === "VideoObject");
    expect(videoNodes).toHaveLength(9);
  });
});
