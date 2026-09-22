import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { getAllExtensions } from "@/lib/catalog";
import { buildEventReference } from "@/lib/event-reference";
import { getEvents, getEventsSource } from "@/lib/events";
import { PAGE_SEO } from "@/lib/seo/pages";
import { SITE_URL } from "@/lib/site";
import HooksPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

const reference = buildEventReference(getEventsSource(), getEvents(), getAllExtensions());

function eventTerms(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("#events dt")).map((term) => term.textContent ?? "");
}

describe("hooks page", () => {
  it("has exactly one h1, ordered headings and no em or en dashes", () => {
    const { container } = render(<HooksPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)));
    levels.slice(1).forEach((level, index) => {
      expect(level - levels[index]).toBeLessThanOrEqual(1);
    });
  });

  it("lists every event from the synced file exactly once, in family groups", () => {
    const { container } = render(<HooksPage />);
    const terms = eventTerms(container);
    expect(terms).toHaveLength(getEvents().length);
    expect(new Set(terms).size).toBe(terms.length);
    for (const event of getEvents()) expect(terms).toContain(event.name);
    expect(screen.getByRole("heading", { level: 3, name: /^Engine/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /^Calls on \$/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /^Classic/ })).toBeInTheDocument();
  });

  it("browses with each family collapsed behind a native summary, closed by default", () => {
    const { container } = render(<HooksPage />);
    const familyDetails = container.querySelectorAll("#events details");
    expect(familyDetails).toHaveLength(3);
    for (const details of familyDetails) expect((details as HTMLDetailsElement).open, details.textContent ?? "").toBe(false);
    expect(screen.getByText(`${getEvents().length} events in 3 families. Open one, or filter to see matches right away.`)).toBeInTheDocument();
  });

  it("gives every event a row that links its declaring line and lists exactly the entries the reference says use it", () => {
    const { container } = render(<HooksPage />);
    for (const row of reference.rows) {
      const item = container.querySelector(`[id="${row.anchorId}"]`) as HTMLElement;
      expect(item, row.name).not.toBeNull();
      expect(within(item).getByRole("link", { name: /line \d+/ })).toHaveAttribute("href", row.sourceUrl);
      const entryLinks = within(item).queryAllByRole("link", { name: (name) => !/^line \d+/.test(name) });
      expect(entryLinks, row.name).toHaveLength(row.users.length);
    }
  });

  it("names the commit, the Claude Code version and the date the event names were read", () => {
    const { container } = render(<HooksPage />);
    const source = getEventsSource();
    expect(container.textContent).toContain(source.sha.slice(0, 7));
    expect(container.textContent).toContain(source.syncedAt);
    if (source.claudeCodeVersion !== null) expect(container.textContent).toContain(`Claude Code ${source.claudeCodeVersion}`);
  });

  it("says the page does not say what an event does, and that use is not checked against code", () => {
    render(<HooksPage />);
    expect(screen.getByText(/does not say\s+what an event does/)).toBeInTheDocument();
    expect(screen.getByText(/not checked against its code/)).toBeInTheDocument();
  });

  it("explains that a classic hook plugin's plain name is the same event as classic.<Name>", () => {
    render(<HooksPage />);
    expect(screen.getByText(/lists a classic event by its plain name/)).toBeInTheDocument();
  });

  it("does not count or promise run-from-source for the mods, which the catalog does not back", () => {
    const { container } = render(<HooksPage />);
    expect(container.textContent).not.toMatch(/\b(four|4) mods\b/i);
    expect(container.textContent).not.toMatch(/run each one from source/i);
  });

  it("calls the mods early access and does not name an unverified enabling flag", () => {
    const { container } = render(<HooksPage />);
    expect(container.textContent).toMatch(/early\s+access/);
    expect(container.textContent).not.toMatch(/CLAUDE_CODE_ENABLE_FUNCTION_HOOKS/);
  });

  it("lists hook names that select no event apart, and says why", () => {
    const { container } = render(<HooksPage />);
    expect(reference.otherNames.length).toBeGreaterThan(0);
    const section = container.querySelector("#other-names") as HTMLElement;
    const terms = Array.from(section.querySelectorAll("dt")).map((term) => term.textContent);
    expect(terms).toEqual(reference.otherNames.map((other) => other.name));
    expect(within(section).getByText(/select none of the events above/)).toBeInTheDocument();
  });

  it("filters the events from the page", async () => {
    const user = userEvent.setup();
    const { container } = render(<HooksPage />);
    await user.type(screen.getByRole("searchbox", { name: "Filter events" }), "fs.write");
    expect(eventTerms(container)).toEqual(["fs.write"]);
    expect(screen.getByRole("status")).toHaveTextContent(`Showing 1 of ${getEvents().length} events`);
  });

  it("has its own canonical URL and a unique title", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${PAGE_SEO.hooks.path}`);
  });

  it("embeds one parseable JSON-LD graph", () => {
    const { container } = render(<HooksPage />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(() => JSON.parse(scripts[0].textContent ?? "")).not.toThrow();
  });
});
