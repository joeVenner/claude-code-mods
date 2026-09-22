import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import {
  CLASSIC_DIFFERENCES,
  CLASSIC_SHELL_GUARD,
  ENGINE_COUNTERPARTS,
  NO_OFFICIAL_GUIDE,
  PLUGIN_DEV_MIGRATION_URL,
  RESULT_MAPPING,
  SCOPE_NOTE,
} from "@/components/docs/migrationContent";
import { getEvents, getEventsSource } from "@/lib/events";
import { loadMigrationExampleFiles, MIGRATION_EXAMPLE_DIRECTORY } from "@/lib/migration-example";
import { PAGE_SEO } from "@/lib/seo/pages";
import { COMMUNITY_REPOSITORY_URL, SITE_URL } from "@/lib/site";
import MigrationPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("migration page", () => {
  it("has exactly one h1, ordered headings and no em or en dashes", () => {
    const { container } = render(<MigrationPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)));
    levels.slice(1).forEach((level, index) => {
      expect(level - levels[index]).toBeLessThanOrEqual(1);
    });
  });

  it("says first that Anthropic publishes no guide for this move, and points at the one it does publish for a different move", () => {
    render(<MigrationPage />);
    const note = screen.getAllByRole("note")[0];
    expect(note).toHaveTextContent(NO_OFFICIAL_GUIDE);
    expect(within(note).getByRole("link", { name: /plugin-dev migration guide/ })).toHaveAttribute("href", PLUGIN_DEV_MIGRATION_URL);
    expect(note).toHaveTextContent(SCOPE_NOTE);
    expect(note).toHaveTextContent(/early access/);
  });

  it("shows every difference with the sources it comes from", () => {
    const { container } = render(<MigrationPage />);
    const section = container.querySelector("#what-changes") as HTMLElement;
    for (const difference of CLASSIC_DIFFERENCES) {
      const row = within(section).getByText(difference.term).closest("div") as HTMLElement;
      for (const source of difference.sources) {
        expect(within(row).getByRole("link", { name: new RegExp(source.label) })).toHaveAttribute("href", source.href);
      }
    }
  });

  it("gives one table row for each way a classic result becomes a return, each with every source it rests on", () => {
    const { container } = render(<MigrationPage />);
    const table = within(container.querySelector("#results") as HTMLElement).getByRole("table");
    expect(within(table).getAllByRole("rowheader")).toHaveLength(RESULT_MAPPING.length);
    for (const row of RESULT_MAPPING) {
      const header = within(table).getByRole("rowheader", { name: row.classic });
      const cells = within(header.closest("tr") as HTMLElement).getAllByRole("cell");
      expect(cells[0]).toHaveTextContent(row.functionHook);
      const links = within(cells[1]).getAllByRole("link");
      expect(links.map((link) => link.getAttribute("href")), row.id).toEqual(row.sources.map((source) => source.href));
    }
  });

  it("links each engine event to its row on the Hooks page, and does not claim a classic event sits inside one", () => {
    const { container } = render(<MigrationPage />);
    const section = container.querySelector("#engine-events") as HTMLElement;
    expect(section.textContent).toMatch(/the declarations relate an engine event to it/);
    expect(section.textContent).not.toMatch(/sit inside/);
    const table = within(section).getByRole("table");
    for (const pair of ENGINE_COUNTERPARTS) {
      const link = within(table).getByRole("link", { name: pair.engineEvent });
      expect(link.getAttribute("href")).toMatch(new RegExp(`^/hooks/?#event-${pair.engineEvent.replace(".", "\\.")}$`));
    }
  });

  it("shows the classic script, its settings and the example mod's module exactly as they are on disk", () => {
    const { container } = render(<MigrationPage />);
    const section = container.querySelector("#example") as HTMLElement;
    expect(within(section).getByRole("group", { name: "Contents of .claude/hooks/block-rm.sh" }).textContent).toBe(CLASSIC_SHELL_GUARD);
    const [register] = loadMigrationExampleFiles();
    const block = within(section).getByRole("group", { name: `Contents of ${MIGRATION_EXAMPLE_DIRECTORY}/${register.path}` });
    expect(block.textContent).toBe(register.content);
  });

  it("says the example is this site's own and links its folder", () => {
    const { container } = render(<MigrationPage />);
    const section = within(container.querySelector("#example") as HTMLElement);
    expect(section.getByText(/not one of Anthropic.s mods/)).toBeInTheDocument();
    expect(section.getByRole("link", { name: new RegExp(MIGRATION_EXAMPLE_DIRECTORY) })).toHaveAttribute(
      "href",
      `${COMMUNITY_REPOSITORY_URL}/tree/main/${MIGRATION_EXAMPLE_DIRECTORY}`,
    );
  });

  it("lists every classic event from the synced file, each linking its Hooks page row", () => {
    const { container } = render(<MigrationPage />);
    const section = within(container.querySelector("#classic-events") as HTMLElement);
    const classic = getEvents().filter((event) => event.family === "classic");
    expect(classic.length).toBeGreaterThan(0);
    expect(section.getAllByRole("listitem")).toHaveLength(classic.length);
    for (const event of classic) {
      const href = section.getByRole("link", { name: event.name }).getAttribute("href") ?? "";
      expect(href).toMatch(new RegExp(`^/hooks/?#event-${event.name.replace(".", "\\.")}$`));
    }
  });

  it("names the commit the checks ran against, says what was not checked, and gives the commands that repeat them", () => {
    const { container } = render(<MigrationPage />);
    const section = container.querySelector("#how-checked") as HTMLElement;
    const source = getEventsSource();
    expect(section.textContent).toContain(source.sha.slice(0, 7));
    expect(section.textContent).toContain(source.syncedAt);
    expect(section.textContent).toMatch(/Not checked: how the engine behaves at run time/);
    expect(within(section).getByText("npm run typecheck:templates")).toBeInTheDocument();
    expect(within(section).getByText(`CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin validate ${MIGRATION_EXAMPLE_DIRECTORY}`)).toBeInTheDocument();
  });

  it("does not recommend one route over the other or claim the example was tested", () => {
    const { container } = render(<MigrationPage />);
    expect(container.textContent).toMatch(/does not recommend one over the other/);
    expect(container.textContent).not.toMatch(/\b(tested|reviewed|scanned)\b.*example mod/i);
  });

  it("has its own canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${PAGE_SEO.learnMigration.path}`);
  });

  it("embeds one parseable JSON-LD graph with Learn as the parent step", () => {
    const { container } = render(<MigrationPage />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const graph = JSON.parse(scripts[0].textContent ?? "") as { "@graph": { "@type": string; itemListElement?: { name: string }[] }[] };
    const crumbs = graph["@graph"].find((node) => node["@type"] === "BreadcrumbList")?.itemListElement ?? [];
    expect(crumbs.map((crumb) => crumb.name)).toEqual(["Home", "Learn", "Migration"]);
  });
});
