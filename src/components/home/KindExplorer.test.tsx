import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { EXTENSION_KINDS, KIND_LABELS } from "@/lib/types";
import type { ExtensionKind } from "@/lib/types";
import { KIND_CELL_ORDER, KindExplorer, kindBrowseHref } from "./KindExplorer";
import { KIND_DESCRIPTIONS } from "./kind-descriptions";
import { buildFeaturedMods, buildFixture } from "./__fixtures__/extensions";
import { stubIntersectionObserver } from "./__fixtures__/intersection-observer";
import { describeBuiltInMods } from "./home-data";

const COUNTS: Readonly<Record<ExtensionKind, number>> = {
  plugin: 8,
  skill: 5,
  agent: 1,
  hook: 3,
  "mcp-server": 7,
  command: 3,
  mod: 4,
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

  it("puts the mod cell first, as the largest cell, linking to the mod filter", () => {
    render(<KindExplorer counts={COUNTS} />);
    const cells = screen.getAllByRole("listitem");
    const [firstCell] = cells;

    expect(KIND_CELL_ORDER[0]).toBe("mod");
    expect(within(firstCell).getByText("Mod")).toBeInTheDocument();
    expect(within(firstCell).getByRole("link").getAttribute("href")).toMatch(/^\/browse\/?\?kind=mod$/);
    // The mod cell is the only one spanning two rows at lg and both columns at md.
    expect(firstCell.className).toContain("lg:row-span-2");
    expect(firstCell.className).toContain("lg:col-span-6");
    for (const cell of cells.slice(1)) {
      expect(cell.className).not.toContain("row-span-2");
    }
  });

  it("is not dashed or marked as a concept", () => {
    const { container } = render(<KindExplorer counts={COUNTS} />);
    const modLink = screen.getAllByRole("listitem")[0].querySelector("a") as HTMLElement;
    expect(modLink.className).not.toContain("border-dashed");
    expect(container.textContent ?? "").not.toMatch(/concept/i);
  });

  it("orders cells as a permutation of every kind with no duplicates", () => {
    expect([...KIND_CELL_ORDER].sort()).toEqual([...EXTENSION_KINDS].sort());
  });

  it("shows counts from props and singular wording for one", () => {
    render(<KindExplorer counts={COUNTS} />);
    expect(screen.getByText("8 listings")).toBeInTheDocument();
    expect(screen.getByText("1 listing")).toBeInTheDocument();
    expect(screen.getByText("4 listings")).toBeInTheDocument();
  });

  it("renders zero counts without hiding the cell", () => {
    render(<KindExplorer counts={{ ...COUNTS, hook: 0 }} />);
    expect(screen.getByText("0 listings")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(EXTENSION_KINDS.length);
  });

  it("defines a mod from the README without claiming who ships it or what it costs", () => {
    render(<KindExplorer counts={COUNTS} />);
    const description = screen.getByText(KIND_DESCRIPTIONS.mod);
    expect(description).toHaveTextContent(/plugin whose behavior lives in a hooks module/);
    for (const kind of EXTENSION_KINDS) {
      expect(KIND_DESCRIPTIONS[kind]).not.toMatch(/early access|built in|anthropic|\b(one|two|three|four|five|\d+)\b/i);
    }
  });

  it("adds the note derived from the catalog only when one is given", () => {
    const { unmount } = render(<KindExplorer counts={COUNTS} />);
    expect(screen.queryByText(/Anthropic publishes/)).not.toBeInTheDocument();
    unmount();

    render(<KindExplorer counts={COUNTS} builtInModsNote="Anthropic publishes 3 mods in owner/repo. They ship built in. Early access." />);
    expect(screen.getByText(/Anthropic publishes 3 mods in owner\/repo/)).toBeInTheDocument();
    // The note belongs to the mod cell only.
    expect(screen.getAllByText(/Anthropic publishes/)).toHaveLength(1);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(/Anthropic publishes 3 mods/);
  });

  it("renders the note from real data for zero, one and three Anthropic mods next to a community mod", () => {
    const community = buildFixture({ slug: "community-mod", name: "community-mod", kind: "mod", publisherKind: "community", availability: "source-only" });
    const cases: readonly (readonly [number, RegExp | null])[] = [
      [0, null],
      [1, /Anthropic publishes 1 mod in fixture-vendor\/fixture-repo\. It ships built in\. Early access\./],
      [3, /Anthropic publishes 3 mods in fixture-vendor\/fixture-repo\. They ship built in\. Early access\./],
    ];
    for (const [anthropicCount, expected] of cases) {
      const catalog = [...buildFeaturedMods(anthropicCount), community];
      const { unmount } = render(<KindExplorer counts={COUNTS} builtInModsNote={describeBuiltInMods(catalog)} />);
      if (expected === null) expect(screen.queryByText(/Anthropic publishes/)).not.toBeInTheDocument();
      else expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    }
  });

  it("gives every kind a description without dashes", () => {
    for (const kind of EXTENSION_KINDS) {
      expect(KIND_DESCRIPTIONS[kind].length).toBeGreaterThan(20);
      expect(KIND_DESCRIPTIONS[kind]).not.toMatch(/[–—]/);
    }
  });

  it("encodes the kind in the browse href", () => {
    expect(kindBrowseHref("mcp-server")).toBe("/browse/?kind=mcp-server");
    expect(kindBrowseHref("mod")).toBe("/browse/?kind=mod");
  });
});
