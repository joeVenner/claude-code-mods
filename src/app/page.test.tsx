import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { HOME_FIXTURES } from "@/components/home/__fixtures__/extensions";
import { EXTENSION_KINDS } from "@/lib/types";
import type { ExtensionKind } from "@/lib/types";
import HomePage, { metadata } from "./page";
import { stubIntersectionObserver } from "@/components/home/__fixtures__/intersection-observer";

vi.mock("@/lib/catalog", () => {
  const featured = HOME_FIXTURES.filter((extension) => extension.isFeatured);
  const counts = Object.fromEntries(EXTENSION_KINDS.map((kind) => [kind, 0])) as Record<ExtensionKind, number>;
  for (const extension of HOME_FIXTURES) counts[extension.kind] += 1;
  return {
    getAllExtensions: () => HOME_FIXTURES,
    getFeaturedExtensions: () => featured,
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
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Find extensions for Claude Code");
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
    expect(screen.getByText("1 concept")).toBeInTheDocument();
    expect(screen.getByText("2 listings", { selector: "span" })).toBeInTheDocument();
  });

  it("exports metadata with a canonical path and a description", () => {
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.description).toBeTruthy();
  });
});
