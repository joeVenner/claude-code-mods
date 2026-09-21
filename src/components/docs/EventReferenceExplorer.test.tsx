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

describe("EventReferenceExplorer", () => {
  it("shows every event, grouped by family in a fixed order and then by noun", () => {
    render(<EventReferenceExplorer rows={ROWS} />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "Engine (2)",
      "Calls on $ (1)",
      "Classic (1)",
    ]);
    expect(screen.getAllByRole("heading", { level: 4 }).map((heading) => heading.textContent)).toEqual(["session", "tool", "fs", "classic"]);
    expect(eventNames()).toEqual(["session.start", "tool.call", "fs.write", "classic.PreToolUse"]);
    expect(screen.getByRole("status")).toHaveTextContent("Showing 4 of 4 events");
  });

  it("gives every row an anchor id, so another page can link to it", () => {
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

  it("says nothing matches and clears both filters from the empty state", async () => {
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
  });

  it("renders with no rows without failing, and reports zero", () => {
    render(<EventReferenceExplorer rows={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Showing 0 of 0 events");
    expect(screen.getByText("No event matches")).toBeInTheDocument();
  });

  it("renders hostile entry names and hook names as inert text", () => {
    const hostile = [
      row("tool.call", "engine", 6, [{ slug: "a-b", name: "<img src=x onerror=alert(1)>", kind: "hook", publisherKind: "community", via: "<script>x</script>" }]),
    ];
    const { container } = render(<EventReferenceExplorer rows={hostile} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(screen.getByText("<script>x</script>")).toBeInTheDocument();
  });
});
