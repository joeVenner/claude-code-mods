import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HOME_FIXTURES } from "./__fixtures__/extensions";
import { HeroSearch } from "./HeroSearch";

function renderSearch(): void {
  render(<HeroSearch extensions={HOME_FIXTURES} />);
}

function getRows(): readonly HTMLElement[] {
  return screen.queryAllByRole("article");
}

function getSeeAllUrl(): URL {
  const link = screen.getByRole("link", { name: /^See all \d+ results?$/ });
  return new URL(link.getAttribute("href") ?? "", "http://localhost");
}

describe("HeroSearch", () => {
  it("shows at most five rows with no query, in catalog order", () => {
    renderSearch();
    const rows = getRows();
    expect(rows).toHaveLength(5);
    expect(within(rows[0]).getByRole("link", { name: "Alpha Plugin" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 5 of 8 results");
  });

  it("labels the search field and lists kind filters as toggle buttons", () => {
    renderSearch();
    expect(screen.getByLabelText("Search the directory")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "MCP server" })).toHaveAttribute("aria-pressed", "false");
  });

  it("filters rows as the user types and announces the new count", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByLabelText("Search the directory"), "review");

    expect(getRows()).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Charlie Plugin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Delta Skill" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Alpha Plugin" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 2 results");
  });

  it("narrows results with a kind chip and combines it with the query", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: "Plugin" }));
    expect(getRows()).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Plugin" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");

    await user.type(screen.getByLabelText("Search the directory"), "review");
    expect(getRows()).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Charlie Plugin" })).toBeInTheDocument();
  });

  it("shows an empty state with a reset action when nothing matches", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByLabelText("Search the directory"), "zzzz-no-such-thing");

    expect(getRows()).toHaveLength(0);
    expect(screen.getByText("No listings match")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No results");
    expect(screen.queryByRole("link", { name: /See all/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear search and filters" }));
    expect(getRows()).toHaveLength(5);
    expect(screen.getByLabelText("Search the directory")).toHaveValue("");
  });

  it("links to the browse page without params when nothing is filtered", () => {
    renderSearch();
    const url = getSeeAllUrl();
    expect(url.pathname.replace(/\/$/, "")).toBe("/browse");
    expect(url.search).toBe("");
    expect(screen.getByRole("link", { name: "See all 8 results" })).toBeInTheDocument();
  });

  it("encodes the query and kind into the See all link", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("button", { name: "Command" }));
    await user.type(screen.getByLabelText("Search the directory"), "r&d");

    const url = getSeeAllUrl();
    expect(url.pathname.replace(/\/$/, "")).toBe("/browse");
    expect(url.searchParams.get("q")).toBe("r&d");
    expect(url.searchParams.get("kind")).toBe("command");
    expect(url.search).toContain("%26");
  });

  it("counts every match in the See all label, not only the visible rows", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByLabelText("Search the directory"), "e");

    const visibleRows = getRows().length;
    const totalMatches = Number(/of (\d+) results/.exec(screen.getByRole("status").textContent ?? "")?.[1]);
    expect(visibleRows).toBeLessThanOrEqual(5);
    expect(screen.getByRole("link", { name: `See all ${totalMatches} results` })).toBeInTheDocument();
  });

  it("handles an empty catalog without crashing", () => {
    render(<HeroSearch extensions={[]} />);
    expect(screen.getByText("No listings match")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear search and filters" })).not.toBeInTheDocument();
  });
});
