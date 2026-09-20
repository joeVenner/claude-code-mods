import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowseSkeleton } from "./BrowseSkeleton";

describe("BrowseSkeleton", () => {
  it("announces loading once through a busy status region", () => {
    render(<BrowseSkeleton />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(region).toHaveTextContent("Loading extensions");
  });

  it("renders card-shaped placeholders that are hidden from assistive tech", () => {
    const { container } = render(<BrowseSkeleton />);
    const placeholders = container.querySelectorAll('[aria-hidden="true"]');
    expect(placeholders.length).toBeGreaterThan(6);
    expect(container.querySelectorAll("a, button, input")).toHaveLength(0);
  });
});
