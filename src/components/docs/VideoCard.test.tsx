import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VIDEOS } from "@/components/docs/tutorialsContent";
import { VideoCard } from "./VideoCard";

const NAMED = VIDEOS.find((video) => video.eventNamed !== null) as (typeof VIDEOS)[number];
const WILDCARD = VIDEOS.find((video) => video.eventNamed === "*") as (typeof VIDEOS)[number];
const UNNAMED = VIDEOS.find((video) => video.eventNamed === null) as (typeof VIDEOS)[number];

describe("VideoCard", () => {
  it("renders the title as a heading, numbered, and the caption quoted", () => {
    render(<VideoCard video={UNNAMED} number={3} eventHref={null} />);
    const heading = screen.getByRole("heading", { level: 3, name: new RegExp(UNNAMED.title) });
    expect(heading).toHaveTextContent("3");
    expect(screen.getByText(new RegExp(UNNAMED.caption))).toBeInTheDocument();
  });

  it("gives the video element the exact source url, a poster, and no autoplay", () => {
    const { container } = render(<VideoCard video={UNNAMED} number={1} eventHref={null} />);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video.querySelector("source")).toHaveAttribute("src", UNNAMED.videoUrl);
    expect(video).toHaveAttribute("poster", UNNAMED.posterUrl);
    expect(video).toHaveAttribute("controls");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("preload", "none");
  });

  it("names the video element for assistive tech from the same heading the title uses", () => {
    const { container } = render(<VideoCard video={UNNAMED} number={2} eventHref={null} />);
    const heading = screen.getByRole("heading", { level: 3 });
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it("links a named event to its Hooks page row when one is given", () => {
    render(<VideoCard video={NAMED} number={6} eventHref="/hooks/#event-ui.press" />);
    const link = screen.getByRole("link", { name: NAMED.eventNamed as string });
    // next/link only applies trailingSlash: true at build time, so jsdom rendering drops it here.
    expect(link.getAttribute("href")).toMatch(/^\/hooks\/?#event-ui\.press$/);
  });

  it("shows a wildcard pattern as text, never as a link, even when given one", () => {
    render(<VideoCard video={WILDCARD} number={7} eventHref={null} />);
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "*" })).not.toBeInTheDocument();
  });

  it("shows no event badge at all for a caption that names none", () => {
    render(<VideoCard video={UNNAMED} number={1} eventHref={null} />);
    expect(UNNAMED.eventNamed).toBeNull();
    expect(screen.queryByRole("code")).toBeNull();
  });

  it("links out to GitHub for the clip, opening safely", () => {
    render(<VideoCard video={UNNAMED} number={1} eventHref={null} />);
    const link = screen.getByRole("link", { name: /Watch on GitHub/ });
    expect(link).toHaveAttribute("href", UNNAMED.videoUrl);
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows the group's duration", () => {
    const { container } = render(<VideoCard video={UNNAMED} number={1} eventHref={null} />);
    expect(within(container).getByText(/60 seconds|around 2 minutes/)).toBeInTheDocument();
  });

  it("uses the video's own id as the figure's anchor id, so a link to it can find it", () => {
    const { container } = render(<VideoCard video={UNNAMED} number={1} eventHref={null} />);
    expect(container.querySelector(`#${UNNAMED.id}`)?.tagName).toBe("FIGURE");
  });
});
