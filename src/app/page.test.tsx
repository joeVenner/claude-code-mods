import { SITE_URL } from "@/lib/site";
import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { HOME_FIXTURES, buildFeaturedMods } from "@/components/home/__fixtures__/extensions";
import { EXTENSION_KINDS } from "@/lib/types";
import type { ExtensionKind } from "@/lib/types";
import { describeBuiltInMods } from "@/components/home/home-data";
import { getAllExtensions, getFeaturedExtensions } from "@/lib/catalog";
import type { ReactElement } from "react";
import { Hero } from "@/components/home/Hero";
import HomePage, { metadata } from "./page";
import { stubIntersectionObserver } from "@/components/home/__fixtures__/intersection-observer";

// Featured entries are built-in mods, like the real catalog; the rest are ordinary listings.
vi.mock("@/lib/catalog", () => {
  const featuredMods = buildFeaturedMods(4);
  const catalog = [...featuredMods, ...HOME_FIXTURES];
  const counts = Object.fromEntries(EXTENSION_KINDS.map((kind) => [kind, 0])) as Record<ExtensionKind, number>;
  for (const extension of catalog) counts[extension.kind] += 1;
  return {
    getAllExtensions: () => catalog,
    getFeaturedExtensions: () => featuredMods,
    countByKind: () => counts,
    getCatalogGeneratedAt: () => "2026-01-02",
  };
});

const EM_OR_EN_DASH = /[\u2013\u2014]/;

describe("home page", () => {
  beforeAll(stubIntersectionObserver);

  it("renders exactly one h1 and an ordered heading outline", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mods and extensions for Claude Code");
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThanOrEqual(4);
  });

  it("contains no em or en dashes in rendered text", () => {
    const { container } = render(<HomePage />);
    expect(container.textContent).not.toMatch(EM_OR_EN_DASH);
  });

  it("uses one label per intent for the primary destinations", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("link", { name: "Browse the directory" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: "Publish an extension" })).toHaveLength(1);
    const securityLinks = screen.getAllByRole("link", { name: "Read the security model" });
    expect(securityLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("derives kind counts and the catalog date from the catalog module", () => {
    render(<HomePage />);
    expect(screen.getByText("2026-01-02")).toBeInTheDocument();
    // Plugins are the only kind with two listings; mods are the featured four plus one ordinary entry.
    expect(screen.getByText("2 listings", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("5 listings", { selector: "span" })).toBeInTheDocument();
  });

  it("leads with mods: hero copy names them, the mod cell comes first and the featured rows are mods", () => {
    const { container } = render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/mods/i);
    const kindCells = screen.getByRole("region", { name: "Extension kinds" }).querySelectorAll("li");
    expect(kindCells[0].querySelector("a")?.getAttribute("href")).toMatch(/kind=mod$/);
    const featured = within(screen.getByRole("region", { name: "Featured entries" }));
    for (const mod of getFeaturedExtensions()) {
      expect(featured.getByRole("link", { name: mod.name })).toBeInTheDocument();
    }
    expect(container.textContent).not.toMatch(/concept/i);
  });

  it("derives the built-in mod claims from the entries, not from fixed copy", () => {
    render(<HomePage />);
    const expected = describeBuiltInMods(getAllExtensions());
    // The catalog has featured mods plus one more built-in mod, so the count is read from the data.
    expect(expected).toMatch(/^Anthropic publishes 5 mods\b/);
    expect(screen.getByText(expected ?? "missing")).toBeInTheDocument();
    const trust = screen.getByRole("region", { name: "What listing labels mean" });
    expect(within(trust).getByRole("heading", { level: 3, name: "Built in" })).toBeInTheDocument();
  });

  it("passes the client hero search only list fields, never guide or description text", () => {
    // Server components elsewhere on the page get full entries; only the hero crosses into the client.
    const page = HomePage() as ReactElement<{ children: ReactElement<{ extensions?: unknown }>[] }>;
    const heroElement = page.props.children.find((child) => child.type === Hero);
    const serialized = JSON.stringify(heroElement?.props.extensions);
    expect(serialized).toContain(HOME_FIXTURES[0].slug);
    expect(serialized).not.toContain("Fixture setup.");
    expect(serialized).not.toContain("First description paragraph");
    expect(serialized).not.toContain('"guide"');
  });

  it("keeps the hero subtext to twenty words or fewer", () => {
    render(<HomePage />);
    const subtext = screen.getByRole("heading", { level: 1 }).closest("section")?.querySelector("p");
    const wordCount = (subtext?.textContent ?? "").trim().split(/\s+/).length;
    expect(wordCount).toBeGreaterThan(0);
    expect(wordCount).toBeLessThanOrEqual(20);
  });

  it("shows install commands from installable listings only and a run from source block for a mod", () => {
    render(<HomePage />);
    expect(screen.getByText("/plugin install alpha-plugin@fixture-market")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Read a mod running from source" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Install commands for mod-/ })).not.toBeInTheDocument();
  });

  it("exports metadata with a canonical path and a description", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/`);
    expect(metadata.description).toBeTruthy();
  });
});
