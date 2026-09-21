import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { getAllExtensions } from "@/lib/catalog";
import { buildHooksIndex } from "@/lib/hooks-index";
import { PAGE_SEO } from "@/lib/seo/pages";
import { SITE_URL } from "@/lib/site";
import HooksPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

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

  it("splits the two hook systems into their own sections", () => {
    render(<HooksPage />);
    expect(screen.getByRole("heading", { name: /Function hooks/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Classic hooks/ })).toBeInTheDocument();
  });

  it("shows every event the catalog lists exactly once per system", () => {
    const { container } = render(<HooksPage />);
    const { functionHooks, classicHooks } = buildHooksIndex(getAllExtensions());
    const termTexts = Array.from(container.querySelectorAll("dt")).map((term) => term.textContent);
    expect(termTexts).toHaveLength(functionHooks.length + classicHooks.length);
    for (const row of [...functionHooks, ...classicHooks]) expect(termTexts).toContain(row.event);
  });

  it("says the page lists names only and does not describe what an event does", () => {
    render(<HooksPage />);
    expect(screen.getByText(/does not say what an event does/)).toBeInTheDocument();
  });

  it("says the grouping follows entry kind and that event names are not checked against code", () => {
    render(<HooksPage />);
    expect(screen.getByText(/grouped by their kind/)).toBeInTheDocument();
    expect(screen.getByText(/not checked against its code/)).toBeInTheDocument();
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
