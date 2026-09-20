import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { EXTENSION_KINDS, KIND_LABELS } from "@/lib/types";
import type { ExtensionKind } from "@/lib/types";
import { KIND_CELL_ORDER, KindExplorer, kindBrowseHref } from "./KindExplorer";
import { KIND_DESCRIPTIONS } from "./kind-descriptions";
import { stubIntersectionObserver } from "./__fixtures__/intersection-observer";

const COUNTS: Readonly<Record<ExtensionKind, number>> = {
  plugin: 8,
  skill: 5,
  agent: 1,
  hook: 3,
  "mcp-server": 7,
  command: 3,
  mod: 8,
};

describe("KindExplorer", () => {
  beforeAll(stubIntersectionObserver);

  it("renders exactly one cell per extension kind, each a link with a kind param", () => {
    render(<KindExplorer counts={COUNTS} />);
    const cells = screen.getAllByRole("listitem");
    expect(cells).toHaveLength(EXTENSION_KINDS.length);

    for (const kind of EXTENSION_KINDS) {
      const cell = cells.find((candidate) => within(candidate).queryByText(KIND_LABELS[kind]) !== null);
      expect(cell, `cell for ${kind}`).toBeDefined();
      const link = within(cell as HTMLElement).getByRole("link");
      const url = new URL(link.getAttribute("href") ?? "", "http://localhost");
      expect(url.pathname.replace(/\/$/, "")).toBe("/browse");
      expect(url.searchParams.get("kind")).toBe(kind);
    }
  });

  it("orders cells as a permutation of every kind with no duplicates", () => {
    expect([...KIND_CELL_ORDER].sort()).toEqual([...EXTENSION_KINDS].sort());
  });

  it("shows counts from props and singular wording for one", () => {
    render(<KindExplorer counts={COUNTS} />);
    expect(screen.getByText("8 listings")).toBeInTheDocument();
    expect(screen.getByText("1 listing")).toBeInTheDocument();
    expect(screen.getByText("8 concepts")).toBeInTheDocument();
  });

  it("renders zero counts without hiding the cell", () => {
    render(<KindExplorer counts={{ ...COUNTS, hook: 0 }} />);
    expect(screen.getByText("0 listings")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(EXTENSION_KINDS.length);
  });

  it("says plainly that mods are a spec concept, not a confirmed feature", () => {
    render(<KindExplorer counts={COUNTS} />);
    expect(screen.getByText(KIND_DESCRIPTIONS.mod)).toHaveTextContent(/not a confirmed Claude Code feature/);
  });

  it("gives every kind a description without dashes", () => {
    for (const kind of EXTENSION_KINDS) {
      expect(KIND_DESCRIPTIONS[kind].length).toBeGreaterThan(20);
      expect(KIND_DESCRIPTIONS[kind]).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it("encodes the kind in the browse href", () => {
    expect(kindBrowseHref("mcp-server")).toBe("/browse/?kind=mcp-server");
  });
});
