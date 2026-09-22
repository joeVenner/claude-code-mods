import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { EventReferenceRow } from "@/lib/event-reference";
import { EventReferenceExplorer } from "./EventReferenceExplorer";

const SHA = "a".repeat(40);

function row(name: string, family: EventReferenceRow["family"], line: number, users: EventReferenceRow["users"] = []): EventReferenceRow {
  return {
    name,
    family,
    noun: name.slice(0, name.indexOf(".")),
    anchorId: `event-${name}`,
    sourceUrl: `https://github.com/anthropics/claude-code/blob/${SHA}/mods/types/claude-code.d.ts#L${line}`,
    line,
    users,
  };
}

const ROWS: readonly EventReferenceRow[] = [
  row("classic.PreToolUse", "classic", 20, [
    { slug: "diff", name: "diff", kind: "mod", publisherKind: "anthropic", via: "classic.*" },
    { slug: "tidy", name: "tidy", kind: "hook", publisherKind: "community", via: "PreToolUse" },
  ]),
  row("fs.write", "op", 10),
  row("session.start", "engine", 5, [{ slug: "diff", name: "diff", kind: "mod", publisherKind: "anthropic", via: "session.start" }]),
  row("tool.call", "engine", 6),
];

function eventNames(): string[] {
  return Array.from(document.querySelectorAll("dt")).map((term) => term.textContent ?? "");
}

/**
 * jsdom does not compute an accessible name for <details> from its <summary>, and the summary's
 * count is in its own nested <span> for styling, so no single node's direct text equals the whole
 * label; `getByText` cannot find it. Match on the summary's full `textContent` instead.
 */
function familyDetails(summaryText: string): HTMLDetailsElement {
  const summary = Array.from(document.querySelectorAll("summary")).find((candidate) => candidate.textContent === summaryText);
  const details = summary?.closest("details");
  if (details === undefined || details === null) throw new Error(`no <summary> with text ${JSON.stringify(summaryText)}`);
  return details;
}

/** The clickable summary itself, for opening or closing its <details>. */
function familySummaryElement(summaryText: string): HTMLElement {
  const summary = familyDetails(summaryText).querySelector("summary");
  if (summary === null) throw new Error(`${summaryText}'s <details> has no <summary>`);
  return summary;
}

describe("EventReferenceExplorer, browsing (no filter)", () => {
  it("shows one collapsed <details> per family, in a fixed order, each closed by default", () => {
    render(<EventReferenceExplorer rows={ROWS} />);
    for (const summaryText of ["Engine (2)", "Calls on $ (1)", "Classic (1)"]) {
      expect(familyDetails(summaryText).open, summaryText).toBe(false);
    }
  });

  it("says how many events and families there are instead of a live filter count", () => {
    render(<EventReferenceExplorer rows={ROWS} />);
    expect(screen.getByText("4 events in 3 families. Open one, or filter to see matches right away.")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps each family's real h3 heading in the outline, inside its summary, whether open or closed", () => {
    render(<EventReferenceExplorer rows={ROWS} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Engine (2)",
      "Calls on $ (1)",
      "Classic (1)",
    ]);
  });

  it("still gives every row an anchor id, whether or not its family is open", () => {
    const { container } = render(<EventReferenceExplorer rows={ROWS} />);
    for (const eventRow of ROWS) expect(container.querySelector(`[id="${eventRow.anchorId}"]`), eventRow.name).not.toBeNull();
  });

  it("opens a family on click and shows its noun headings and rows", async () => {
    const user = userEvent.setup();
    render(<EventReferenceExplorer rows={ROWS} />);
    const details = familyDetails("Engine (2)");
    await user.click(familySummaryElement("Engine (2)"));
    expect(details.open).toBe(true);
    expect(within(details).getAllByRole("heading", { level: 4 }).map((heading) => heading.textContent)).toEqual(["session", "tool"]);
    expect(within(details).getByText("session.start")).toBeInTheDocument();
    expect(within(details).getByText("tool.call")).toBeInTheDocument();
  });

  it("keeps other families closed when one is opened", async () => {
    const user = userEvent.setup();
    render(<EventReferenceExplorer rows={ROWS} />);
    await user.click(familySummaryElement("Engine (2)"));
    expect(familyDetails("Engine (2)").open).toBe(true);
    expect(familyDetails("Classic (1)").open).toBe(false);
    expect(familyDetails("Calls on $ (1)").open).toBe(false);
  });

  it("switches to the flat, always-open filtered view as soon as a query is typed", async () => {
    const user = userEvent.setup();
    render(<EventReferenceExplorer rows={ROWS} />);
    await user.type(screen.getByRole("searchbox", { name: "Filter events" }), "tool");
    expect(document.querySelector("details")).toBeNull();
    expect(screen.getByRole("heading", { level: 3, name: /Engine/ })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 4 events");
  });

  it("switches to the flat view as soon as a family is picked, even with no query", async () => {
    const user = userEvent.setup();
    render(<EventReferenceExplorer rows={ROWS} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Family" }), "engine");
    expect(document.querySelector("details")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 4 events");
  });

  it("renders with no rows without failing, and shows the empty state instead of a details list", () => {
    render(<EventReferenceExplorer rows={[]} />);
    expect(document.querySelector("details")).toBeNull();
    expect(screen.getByText("No event matches")).toBeInTheDocument();
  });
});

describe("EventReferenceExplorer, filtered (a query or a family is set)", () => {
  it("shows matching events as real h3 headings, grouped by family then noun, all open with no <details>", async () => {
    const user = userEvent.setup();
    render(<EventReferenceExplorer rows={ROWS} />);
    await user.type(screen.getByRole("searchbox", { name: "Filter events" }), "e");
    expect(document.querySelector("details")).toBeNull();
    expect(screen.getAllByRole("heading", { level: 3 }).length).toBeGreaterThan(0);
  });

  it("gives every row an anchor id", () => {
    const { container } = render(<EventReferenceExplorer rows={ROWS} />);
    for (const eventRow of ROWS) expect(container.querySelector(`[id="${eventRow.anchorId}"]`), eventRow.name).not.toBeNull();
  });

  it("links the declaring line at the pinned commit, as an external link that opens safely", () => {
    render(<EventReferenceExplorer rows={ROWS} />);
    const item = document.getElementById("event-fs.write") as HTMLElement;
    const link = within(item).getByRole("link", { name: /line 10/ });
    expect(link).toHaveAttribute("href", ROWS[1].sourceUrl);
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("lists the entries that use an event, labels community ones and shows how a name was reached", () => {
    render(<EventReferenceExplorer rows={ROWS} />);
    const item = document.getElementById("event-classic.PreToolUse") as HTMLElement;
    expect(within(item).getByRole("link", { name: "diff" })).toHaveAttribute("href", expect.stringMatching(/^\/extensions\/diff\/?$/));
    expect(within(item).getByRole("link", { name: "tidy" })).toBeInTheDocument();
    expect(within(item).getAllByText(/Community listing/)).toHaveLength(1);
    expect(within(item).getByText("classic.*")).toBeInTheDocument();
    expect(within(item).getByText("PreToolUse")).toBeInTheDocument();
  });

  it("says so when no entry lists an event, and does not repeat the event name as a way it was reached", () => {
    render(<EventReferenceExplorer rows={ROWS} />);
    expect(within(document.getElementById("event-fs.write") as HTMLElement).getByText("No entry in this directory lists it.")).toBeInTheDocument();
    expect(within(document.getElementById("event-session.start") as HTMLElement).queryByText(/lists it as/)).not.toBeInTheDocument();
  });

  it("filters by text and reports how many are shown", async () => {
    const user = userEvent.setup();
    render(<EventReferenceExplorer rows={ROWS} />);
    await user.type(screen.getByRole("searchbox", { name: "Filter events" }), "TOOL");
    expect(eventNames()).toEqual(["tool.call", "classic.PreToolUse"]);
    expect(screen.getByRole("status")).toHaveTextContent("Showing 2 of 4 events");
    expect(screen.queryByRole("heading", { name: /Calls on/ })).not.toBeInTheDocument();
  });

  it("filters by family, and combines the family with the text", async () => {
    const user = userEvent.setup();
    render(<EventReferenceExplorer rows={ROWS} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Family" }), "engine");
    expect(eventNames()).toEqual(["session.start", "tool.call"]);
    await user.type(screen.getByRole("searchbox", { name: "Filter events" }), "session");
    expect(eventNames()).toEqual(["session.start"]);
  });

  it("finds an event by the name of an entry that lists it", async () => {
    const user = userEvent.setup();
    render(<EventReferenceExplorer rows={ROWS} />);
    await user.type(screen.getByRole("searchbox", { name: "Filter events" }), "tidy");
    expect(eventNames()).toEqual(["classic.PreToolUse"]);
  });

  it("says nothing matches and clears both filters back to the browsing view", async () => {
    const user = userEvent.setup();
    render(<EventReferenceExplorer rows={ROWS} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Family" }), "op");
    await user.type(screen.getByRole("searchbox", { name: "Filter events" }), "zzz");
    expect(screen.getByText("No event matches")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Showing 0 of 4 events");

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(eventNames()).toHaveLength(4);
    expect(screen.getByRole("searchbox", { name: "Filter events" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Family" })).toHaveValue("all");
    // Clearing both filters returns to the browsing view: collapsed details, not the flat list.
    expect(familyDetails("Engine (2)").open).toBe(false);
  });

  it("renders hostile entry names and hook names as inert text", async () => {
    const hostile = [
      row("tool.call", "engine", 6, [{ slug: "a-b", name: "<img src=x onerror=alert(1)>", kind: "hook", publisherKind: "community", via: "<script>x</script>" }]),
    ];
    const user = userEvent.setup();
    const { container } = render(<EventReferenceExplorer rows={hostile} />);
    await user.type(screen.getByRole("searchbox", { name: "Filter events" }), "tool");
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(screen.getByText("<script>x</script>")).toBeInTheDocument();
  });
});
