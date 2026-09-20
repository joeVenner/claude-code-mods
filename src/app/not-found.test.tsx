import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import NotFound from "./not-found";

describe("not-found page", () => {
  it("has one h1 and links to browse and home", () => {
    const { container } = render(<NotFound />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Browse the directory" }).getAttribute("href")).toMatch(/^\/browse\/?$/);
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(container.textContent).not.toMatch(DASH_PATTERN);
  });
});
