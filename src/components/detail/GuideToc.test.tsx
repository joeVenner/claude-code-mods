import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildGuideAnchors } from "./guide";
import { GuideTocSidebar } from "./GuideToc";
import { GuideTocCollapsible } from "./GuideTocCollapsible";

const ANCHORS = buildGuideAnchors([
  { title: "What it does", paragraphs: ["x"], commands: [] },
  { title: "Set up", paragraphs: ["x"], commands: [] },
]);

describe("GuideTocSidebar", () => {
  it("is the single labelled navigation with one link per section", () => {
    render(<GuideTocSidebar anchors={ANCHORS} />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(nav.querySelectorAll("a")).toHaveLength(2);
    expect(nav.querySelector("a")).toHaveAttribute("href", "#guide-what-it-does");
  });
});

describe("GuideTocCollapsible", () => {
  it("starts closed and has no navigation landmark of its own", () => {
    const { container } = render(<GuideTocCollapsible anchors={ANCHORS} />);
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("closes after a link is tapped", () => {
    const { container } = render(<GuideTocCollapsible anchors={ANCHORS} />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    details.open = true;
    expect(details.open).toBe(true);

    fireEvent.click(screen.getByRole("link", { name: "Set up" }));
    expect(details.open).toBe(false);
  });

  it("stays open when the tap is not on a link", () => {
    const { container } = render(<GuideTocCollapsible anchors={ANCHORS} />);
    const details = container.querySelector("details") as HTMLDetailsElement;
    details.open = true;

    fireEvent.click(container.querySelector("ol") as HTMLElement);
    expect(details.open).toBe(true);
  });

  it("lists every section in order", () => {
    render(<GuideTocCollapsible anchors={ANCHORS} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["What it does", "Set up"]);
  });
});
