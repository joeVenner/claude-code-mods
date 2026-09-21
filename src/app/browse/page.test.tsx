import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { browseFixtures } from "@/components/browse/__fixtures__/browseItems";
import BrowsePage, { metadata } from "./page";
import { SITE_URL } from "@/lib/site";

// Fixtures only: the page must work from whatever the catalog returns, and tests stay hermetic.
vi.mock("@/lib/catalog", () => ({ getAllExtensions: () => browseFixtures }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

describe("browse page", () => {
  it("renders exactly one h1 with the page title", () => {
    render(<BrowsePage />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Browse extensions");
  });

  it("hands the full extension list to the explorer", () => {
    render(<BrowsePage />);
    expect(screen.getByText(`${browseFixtures.length} extensions`)).toBeInTheDocument();
    for (const extension of browseFixtures) {
      expect(screen.getByRole("link", { name: extension.name })).toBeInTheDocument();
    }
  });

  it("passes the client explorer only list fields, never guide or description text", () => {
    const serialized = JSON.stringify(BrowsePage());
    expect(serialized).toContain(browseFixtures[0].slug);
    expect(serialized).not.toContain("Fixture setup.");
    expect(serialized).not.toContain("Fixture description.");
    expect(serialized).not.toContain('"guide"');
  });

  it("exports metadata with a canonical path and no dashes in visible strings", () => {
    expect(metadata.title).toBe("Browse Claude Code extensions");
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/browse/`);
    expect(String(metadata.description)).not.toMatch(/[\u2013\u2014]/);
    expect(String(metadata.description)).not.toMatch(/concept/i);
  });
});
