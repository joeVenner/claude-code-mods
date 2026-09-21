import { SITE_URL } from "@/lib/site";
import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { getIdeas, getIdeasCheckedAt } from "@/lib/ideas";
import IdeasPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("ideas page", () => {
  it("has exactly one h1 named Proposed ideas and no em or en dashes", () => {
    const { container } = render(<IdeasPage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Proposed ideas");
    expect(container.textContent).not.toMatch(DASH_PATTERN);
  });

  it("renders every idea from the dataset with its anchor, name, summary and events", () => {
    const { container } = render(<IdeasPage />);
    const ideas = getIdeas();
    expect(ideas.length).toBeGreaterThan(0);
    for (const idea of ideas) {
      const article = container.querySelector(`article#${idea.slug}`) as HTMLElement | null;
      expect(article, idea.slug).not.toBeNull();
      const scope = within(article as HTMLElement);
      expect(scope.getByRole("heading", { level: 2, name: idea.name })).toBeInTheDocument();
      expect(scope.getByText(idea.summary)).toBeInTheDocument();
      for (const eventName of idea.proposedEvents) {
        expect(scope.getByText(eventName)).toBeInTheDocument();
      }
      expect(scope.getByText(idea.specReference)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("article")).toHaveLength(ideas.length);
  });

  it("shows a prominent notice with the three facts a reader must see", () => {
    render(<IdeasPage />);
    const notice = screen.getByRole("note");
    expect(notice).toHaveAttribute("data-tone", "warning");
    expect(notice.querySelector("svg")).not.toBeNull();
    expect(notice).toHaveTextContent(/proposals with no public implementation/);
    expect(notice).toHaveTextContent(/quoted from the spec and may not match the dotted names the real engine uses/);
    expect(notice).toHaveTextContent(/repositories the spec named did not resolve on/);
    expect(within(notice).getByText(getIdeasCheckedAt())).toBeInTheDocument();
  });

  it("links the notice to the real mods in the directory", () => {
    render(<IdeasPage />);
    const link = within(screen.getByRole("note")).getByRole("link", { name: /browse the mods/i });
    expect(link.getAttribute("href")).toMatch(/^\/browse\/?\?kind=mod$/);
  });

  it("ends with an invitation that links to the publish page using the site's publish label", () => {
    render(<IdeasPage />);
    const link = screen.getByRole("link", { name: "Publish an extension" });
    expect(link.getAttribute("href")).toMatch(/^\/publish\/?$/);
  });

  it("does not call ideas installable, verified or reviewed", () => {
    const { container } = render(<IdeasPage />);
    expect(container.textContent).not.toMatch(/Source verified|security reviewed|unconfirmed/i);
    expect(container.querySelector("form, input, textarea, select")).toBeNull();
  });

  it("keeps heading levels in order", () => {
    render(<IdeasPage />);
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)));
    levels.slice(1).forEach((level, index) => {
      expect(level - levels[index]).toBeLessThanOrEqual(1);
    });
  });

  it("exports metadata with a canonical path", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/ideas/`);
    expect(metadata.title).toBe("Proposed Claude Code mod ideas");
  });
});
