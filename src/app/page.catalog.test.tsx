import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { stubIntersectionObserver } from "@/components/home/__fixtures__/intersection-observer";
import { EXTENSION_KINDS } from "@/lib/types";
import HomePage from "./page";

const EM_OR_EN_DASH = /[–—]/;

// Renders against the bundled catalog.json (a local file, no network) so a bad catalog edit
// that would break the landing page or introduce a banned dash fails here first.
describe("home page with the bundled catalog", () => {
  beforeAll(stubIntersectionObserver);

  it("renders one h1, one link per kind, and no em or en dashes or concept wording", () => {
    const { container } = render(<HomePage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(EM_OR_EN_DASH);
    expect(container.textContent).not.toMatch(/concept/i);

    const kindLinks = screen
      .getAllByRole("link")
      .filter((link) => (link.getAttribute("href") ?? "").includes("kind="));
    expect(kindLinks).toHaveLength(EXTENSION_KINDS.length);
  });
});
