import { render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HOME_FIXTURES, buildFixture } from "@/components/home/__fixtures__/extensions";
import { stubIntersectionObserver } from "@/components/home/__fixtures__/intersection-observer";
import type { Extension } from "@/lib/types";
import HomePage from "./page";

// The mock reads this state on every call, so each test picks the catalog and the featured set.
const catalogState = vi.hoisted(() => ({ all: [] as readonly Extension[], featured: [] as readonly Extension[] }));

vi.mock("@/lib/catalog", () => ({
  getAllExtensions: () => catalogState.all,
  getFeaturedExtensions: () => catalogState.featured,
  countByKind: () => ({ plugin: 0, skill: 0, agent: 0, hook: 0, "mcp-server": 0, command: 0, mod: 0 }),
  getCatalogGeneratedAt: () => "2026-01-02",
}));

describe("home page when nothing is featured", () => {
  beforeAll(stubIntersectionObserver);

  beforeEach(() => {
    catalogState.all = HOME_FIXTURES.map((extension) => ({ ...extension, isFeatured: false }));
    catalogState.featured = [];
  });

  it("falls back to the most starred entries and says so instead of claiming a hand-picked set", () => {
    catalogState.all = [
      buildFixture({ slug: "popular", name: "Popular Plugin", kind: "plugin", stars: 900 }),
      buildFixture({ slug: "modest", name: "Modest Skill", kind: "skill", stars: 3 }),
      buildFixture({ slug: "unstarred", name: "Unstarred Agent", kind: "agent" }),
    ];
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 2, name: "Most starred" })).toBeInTheDocument();
    expect(screen.queryByText(/hand-picked/i)).not.toBeInTheDocument();
    const featured = within(screen.getByRole("region", { name: "Featured entries" }));
    expect(featured.getByText("900 stars")).toBeInTheDocument();
    expect(featured.getAllByRole("article")).toHaveLength(2);
  });

  it("omits the featured section when nothing is featured and no entry has stars", () => {
    render(<HomePage />);
    expect(screen.queryByRole("region", { name: "Featured entries" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("still renders with an empty catalog", () => {
    catalogState.all = [];
    render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByText(/Anthropic publishes/)).not.toBeInTheDocument();
    expect(screen.getByText("No copyable commands yet")).toBeInTheDocument();
  });

  it("keeps community install commands out of the home page install stack", () => {
    catalogState.all = [
      buildFixture({
        slug: "community-plugin",
        name: "Community Plugin",
        kind: "plugin",
        publisherKind: "community",
        installCommands: ["/plugin install community-plugin"],
      }),
    ];
    render(<HomePage />);
    expect(screen.queryByText("/plugin install community-plugin")).not.toBeInTheDocument();
    expect(screen.getByText("No copyable commands yet")).toBeInTheDocument();
  });
});
