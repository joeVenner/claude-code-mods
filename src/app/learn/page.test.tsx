import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { CONCEPTS, KIND_COMPARISON, LEARN_FAQ, LEARN_SOURCES } from "@/components/docs/learnContent";
import { getEvents, getEventsSource } from "@/lib/events";
import { PAGE_SEO } from "@/lib/seo/pages";
import { SITE_URL } from "@/lib/site";
import LearnPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

/** next/link applies `trailingSlash` only in a real build, so compare internal paths without it. */
function pathOf(element: HTMLElement): string | null {
  return element.getAttribute("href")?.replace(/\/$/, "") ?? null;
}

describe("learn page", () => {
  it("has exactly one h1, ordered headings and no em or en dashes", () => {
    const { container } = render(<LearnPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)));
    levels.slice(1).forEach((level, index) => {
      expect(level - levels[index]).toBeLessThanOrEqual(1);
    });
  });

  it("says up front that mods are early access and the site is unofficial", () => {
    render(<LearnPage />);
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/early access/);
    expect(note).toHaveTextContent(/unofficial/);
  });

  it("explains what a mod is and the five ideas behind it", () => {
    render(<LearnPage />);
    // level: 2 disambiguates from the FAQ section's own "What is a Claude Mod?" question, an h3.
    expect(screen.getByRole("heading", { name: "What is a Claude Mod?", level: 2 })).toBeInTheDocument();
    for (const term of ["A hook is a function", "The $ object", "next continues the chain", "Administrators sit outermost", "Plugins can draw"]) {
      expect(screen.getByText(term)).toBeInTheDocument();
    }
  });

  it("compares a mod with each other kind in one table, each row with its source link", () => {
    render(<LearnPage />);
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("rowheader").map((header) => header.textContent)).toEqual(KIND_COMPARISON.map((row) => row.name));
    for (const row of KIND_COMPARISON) {
      const link = within(table).getByRole("link", { name: new RegExp(row.source.label) });
      expect(link).toHaveAttribute("href", row.source.href);
    }
  });

  it("reports the event counts from the synced file, and names the commit they were read at", () => {
    const { container } = render(<LearnPage />);
    const source = getEventsSource();
    const section = container.querySelector("#events") as HTMLElement;
    expect(section.textContent).toContain(`${getEvents().length} events`);
    expect(section.textContent).toContain(source.sha.slice(0, 7));
    expect(section.textContent).toContain(source.syncedAt);
    expect(pathOf(within(section).getByRole("link", { name: "Hooks page" }))).toBe("/hooks");
  });

  it("links the announcement issue and the Mods README as external links that open safely", () => {
    render(<LearnPage />);
    for (const [name, href] of [["announcement issue", LEARN_SOURCES.announcementIssue], ["Mods README", LEARN_SOURCES.modsReadme]] as const) {
      const link = screen.getAllByRole("link", { name: new RegExp(name) })[0];
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("counts the other ways from the table, not from a number written in the copy", () => {
    const { container } = render(<LearnPage />);
    const intro = (container.querySelector("#compared") as HTMLElement).textContent ?? "";
    expect(intro).toContain(`extended in ${KIND_COMPARISON.length - 1} other ways`);
    expect(KIND_COMPARISON.length - 1).toBe(4);
  });

  it("links a source under every idea, and does not claim that every claim is linked", () => {
    const { container } = render(<LearnPage />);
    const section = container.querySelector("#how-it-works") as HTMLElement;
    for (const concept of CONCEPTS) {
      const row = within(section).getByText(concept.term).closest("div") as HTMLElement;
      for (const source of concept.sources) {
        expect(within(row).getByRole("link", { name: new RegExp(source.label) })).toHaveAttribute("href", source.href);
      }
    }
    expect(screen.getByRole("note")).not.toHaveTextContent(/every claim/);
  });

  it("does not claim the site reviewed or scanned anything", () => {
    const { container } = render(<LearnPage />);
    expect(container.textContent).not.toMatch(/\b(reviewed|scanned|audited|verified by)\b/i);
  });

  it("gives the video tutorials and the getting-started guide their own prominent buttons, above the fold", () => {
    render(<LearnPage />);
    const primary = screen.getByRole("link", { name: "Watch the video tutorials" });
    const secondary = screen.getByRole("link", { name: "Build your first mod" });
    expect(pathOf(primary)).toBe("/learn/tutorials");
    expect(pathOf(secondary)).toBe("/learn/getting-started");
    // Both buttons come before the first h2, so they read as an action a visitor can take immediately.
    const firstHeading = screen.getAllByRole("heading", { level: 2 })[0];
    expect(primary.compareDocumentPosition(firstHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("links on to getting started, the migration guide, the video tutorials and the security page", () => {
    render(<LearnPage />);
    expect(pathOf(screen.getByRole("link", { name: "Getting started guide" }))).toBe("/learn/getting-started");
    expect(pathOf(screen.getByRole("link", { name: "classic hooks to function hooks" }))).toBe("/learn/migration");
    expect(pathOf(screen.getByRole("link", { name: "official video tutorials" }))).toBe("/learn/tutorials");
    expect(pathOf(screen.getByRole("link", { name: /what this site does and does not check/ }))).toBe("/security");
    const runtimeLink = screen.getByRole("link", { name: "how Claude Code keeps a mod in check" });
    expect(runtimeLink.getAttribute("href")).toMatch(/^\/security\/?#mod-runtime$/);
  });

  it("has its own canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${PAGE_SEO.learn.path}`);
  });

  it("embeds one parseable JSON-LD graph, with a FAQPage matching the visible questions and answers exactly", () => {
    const { container } = render(<LearnPage />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const parsed = JSON.parse(scripts[0].textContent ?? "") as {
      "@graph": readonly { "@type": string; mainEntity?: readonly { name: string; acceptedAnswer: { text: string } }[] }[];
    };
    const faqNode = parsed["@graph"].find((node) => node["@type"] === "FAQPage");
    expect(faqNode?.mainEntity).toHaveLength(LEARN_FAQ.length);
    for (const entry of LEARN_FAQ) {
      const question = faqNode?.mainEntity?.find((candidate) => candidate.name === entry.question);
      expect(question, entry.id).toBeDefined();
      expect(question?.acceptedAnswer.text).toBe(entry.answer);
    }
  });

  it("shows every FAQ question and its exact answer, the same text the JSON-LD states", () => {
    const { container } = render(<LearnPage />);
    const faqSection = container.querySelector("#faq") as HTMLElement;
    for (const entry of LEARN_FAQ) {
      expect(within(faqSection).getByText(entry.question), entry.id).toBeInTheDocument();
      expect(within(faqSection).getByText(entry.answer), entry.id).toBeInTheDocument();
    }
  });

  it("gives each FAQ question a real h3, reachable by a screen reader's heading navigation, and its own anchor", () => {
    const { container } = render(<LearnPage />);
    const faqSection = container.querySelector("#faq") as HTMLElement;
    expect(within(faqSection).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(
      LEARN_FAQ.map((entry) => entry.question),
    );
    for (const entry of LEARN_FAQ) expect(container.querySelector(`[id="${entry.id}"]`), entry.id).not.toBeNull();
  });

  it("keeps the FAQ's own claims lined up with the section each one restates: the exact same phrase must appear in both, not just a similar one", () => {
    const { container } = render(<LearnPage />);
    const sectionText = (id: string) => (container.querySelector(`#${id}`) as HTMLElement).textContent ?? "";
    const faqAnswer = (id: string) => LEARN_FAQ.find((entry) => entry.id === id)?.answer ?? "";

    for (const [sectionId, faqId, sharedPhrase] of [
      ["what-is-a-mod", "faq-what-is-a-mod", "hooks the engine's events with TypeScript functions shaped"],
      ["events", "faq-what-can-a-mod-hook", "The Hooks page shows which mods and plugins use which events."],
      ["next", "faq-build-first-mod", "Build a small mod in the Getting started guide"],
    ] as const) {
      expect(sectionText(sectionId), sectionId).toContain(sharedPhrase);
      expect(faqAnswer(faqId), faqId).toContain(sharedPhrase);
    }
  });
});
