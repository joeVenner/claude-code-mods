import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline } from "./Timeline";
import type { TimelineItem } from "./Timeline";

const ITEMS: readonly TimelineItem[] = [
  { title: "Fetch", description: "Get the file.", details: ["Check size", "Check type"] },
  { title: "Inspect", description: "Read the file." },
];

describe("Timeline", () => {
  it("renders an ordered list named by its label, one item per entry, in order", () => {
    render(<Timeline items={ITEMS} label="Example process" />);
    const list = screen.getByRole("list", { name: "Example process" });
    expect(list.tagName).toBe("OL");
    const titles = within(list)
      .getAllByRole("heading")
      .map((heading) => heading.textContent);
    expect(titles).toEqual(["Fetch", "Inspect"]);
  });

  it("uses h3 titles by default and h4 when asked", () => {
    const { rerender } = render(<Timeline items={ITEMS} label="Example process" />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);
    rerender(<Timeline items={ITEMS} label="Example process" headingLevel="h4" />);
    expect(screen.getAllByRole("heading", { level: 4 })).toHaveLength(2);
  });

  it("lists details only for items that have them", () => {
    render(<Timeline items={ITEMS} label="Example process" />);
    expect(screen.getByText("Check size")).toBeInTheDocument();
    expect(screen.getAllByRole("list")).toHaveLength(2);
  });

  it("does not number items with step labels", () => {
    const { container } = render(<Timeline items={ITEMS} label="Example process" />);
    expect(container.textContent).not.toMatch(/\b(step|phase|stage)\s*\d/i);
  });

  it("renders an empty list without throwing", () => {
    render(<Timeline items={[]} label="Empty" />);
    expect(screen.getByRole("list", { name: "Empty" }).children).toHaveLength(0);
  });
});
