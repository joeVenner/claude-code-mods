import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HookEventRow } from "@/lib/hooks-index";
import { HookEventList } from "./HookEventList";

const ROWS: readonly HookEventRow[] = [
  {
    event: "session.start",
    entries: [
      { slug: "diff", name: "diff", kind: "mod", publisherKind: "anthropic" },
      { slug: "tidy-hooks", name: "tidy-hooks", kind: "mod", publisherKind: "community" },
    ],
  },
];

describe("HookEventList", () => {
  it("shows the empty message and no list when there are no rows", () => {
    render(<HookEventList rows={[]} emptyMessage="Nothing yet." />);
    expect(screen.getByText("Nothing yet.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders each event with a link to every entry that uses it", () => {
    render(<HookEventList rows={ROWS} emptyMessage="unused" />);
    const term = screen.getByText("session.start");
    expect(term.tagName).toBe("CODE");
    const row = term.closest("div") as HTMLElement;
    expect(within(row).getByRole("link", { name: "diff" })).toHaveAttribute("href", expect.stringMatching(/^\/extensions\/diff\/?$/));
    expect(within(row).getByRole("link", { name: "tidy-hooks" })).toHaveAttribute("href", expect.stringMatching(/^\/extensions\/tidy-hooks\/?$/));
  });

  it("labels community entries and no others", () => {
    render(<HookEventList rows={ROWS} emptyMessage="unused" />);
    expect(screen.getAllByText(/Community listing/)).toHaveLength(1);
  });

  it("renders hostile event names as inert text", () => {
    const hostile: readonly HookEventRow[] = [
      { event: "<img src=x onerror=alert(1)>", entries: [{ slug: "a-b", name: "<b>bold</b>", kind: "hook", publisherKind: "community" }] },
    ];
    const { container } = render(<HookEventList rows={hostile} emptyMessage="unused" />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
  });
});
