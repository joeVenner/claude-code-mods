import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ideaSchema } from "@/lib/types";
import { IdeaList } from "./IdeaList";
import { DASH_PATTERN } from "./testSupport";

const FIRST_IDEA = ideaSchema.parse({
  slug: "fixture-first-idea",
  name: "Fixture first idea",
  summary: "Would do the first thing.",
  description: ["First paragraph.", "Second paragraph."],
  proposedEvents: ["thing:before", "thing:after"],
  specReference: "Fixture report, section 1",
});

const IDEA_WITHOUT_EVENTS = ideaSchema.parse({
  slug: "fixture-quiet-idea",
  name: "Fixture quiet idea",
  summary: "Would do nothing loud.",
  description: ["Only paragraph."],
  proposedEvents: [],
  specReference: "Fixture report, section 2",
});

describe("IdeaList", () => {
  it("renders one article per idea with a stable anchor id and its name as an h2", () => {
    const { container } = render(<IdeaList ideas={[FIRST_IDEA, IDEA_WITHOUT_EVENTS]} />);
    for (const idea of [FIRST_IDEA, IDEA_WITHOUT_EVENTS]) {
      const article = container.querySelector(`article#${idea.slug}`);
      expect(article).not.toBeNull();
      expect(within(article as HTMLElement).getByRole("heading", { level: 2, name: idea.name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("shows the summary, every paragraph and the spec reference", () => {
    render(<IdeaList ideas={[FIRST_IDEA]} />);
    expect(screen.getByText("Would do the first thing.")).toBeInTheDocument();
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    expect(screen.getByText(/Fixture report, section 1/)).toBeInTheDocument();
  });

  it("renders proposed events verbatim as monospace chips in a named list", () => {
    render(<IdeaList ideas={[FIRST_IDEA]} />);
    const events = screen.getByRole("list", { name: "Proposed events for Fixture first idea" });
    const chips = within(events).getAllByRole("listitem");
    expect(chips.map((chip) => chip.textContent)).toEqual(["thing:before", "thing:after"]);
    expect(within(events).getByText("thing:before")).toHaveClass("font-mono");
  });

  it("omits the events list for an idea that proposes none", () => {
    render(<IdeaList ideas={[IDEA_WITHOUT_EVENTS]} />);
    expect(screen.queryByText(/Proposed events/)).toBeNull();
  });

  it("renders nothing but an empty list for no ideas, without throwing", () => {
    render(<IdeaList ideas={[]} />);
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });

  it("offers no install command, repository link or verified badge for an idea", () => {
    const { container } = render(<IdeaList ideas={[FIRST_IDEA]} />);
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).not.toMatch(/Source verified|npm |\/plugin install/);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
  });
});
