import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { VIDEOS, videosInGroup } from "@/components/docs/tutorialsContent";
import { stubIntersectionObserver } from "./__fixtures__/intersection-observer";
import { TutorialsShowcase } from "./TutorialsShowcase";

beforeAll(stubIntersectionObserver);

describe("TutorialsShowcase", () => {
  it("shows exactly the Basic videos, a real subset of VIDEOS and not a hand-picked list", () => {
    render(<TutorialsShowcase />);
    const basic = videosInGroup("basic");
    expect(basic.length).toBeGreaterThan(0);
    expect(basic.length).toBeLessThan(VIDEOS.length);
    for (const video of basic) expect(screen.getByText(video.title)).toBeInTheDocument();
  });

  it("links each card to its exact video on the tutorials page, never playing inline here", () => {
    const { container } = render(<TutorialsShowcase />);
    expect(container.querySelector("video")).toBeNull();
    for (const video of videosInGroup("basic")) {
      const link = screen.getByRole("link", { name: new RegExp(video.title) });
      // next/link only applies trailingSlash: true at build time, so jsdom rendering drops it here.
      expect(link.getAttribute("href")).toBe(`/learn/tutorials#${video.id}`);
    }
  });

  it("shows each card's real poster image, decorative and never the accessible name of its own link", () => {
    const { container } = render(<TutorialsShowcase />);
    for (const video of videosInGroup("basic")) {
      const image = container.querySelector(`img[src="${video.posterUrl}"]`);
      expect(image, video.id).not.toBeNull();
      expect(image).toHaveAttribute("alt", "");
      expect(image).toHaveAttribute("loading", "lazy");
    }
  });

  it("shows the duration for every shown video", () => {
    render(<TutorialsShowcase />);
    expect(screen.getAllByText("60 seconds").length).toBe(videosInGroup("basic").length);
  });

  it("links on to the full tutorials page, naming the real total", () => {
    render(<TutorialsShowcase />);
    const link = screen.getByRole("link", { name: new RegExp(`Watch all ${VIDEOS.length} tutorials`) });
    expect(link).toHaveAttribute("href", "/learn/tutorials");
  });

  it("names the real video count in the section body, not a hardcoded number", () => {
    render(<TutorialsShowcase />);
    expect(screen.getByText(new RegExp(`Anthropic's own ${VIDEOS.length} official videos`))).toBeInTheDocument();
  });
});
