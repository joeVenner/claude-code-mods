import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import SecurityPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("security page", () => {
  it("has exactly one h1, ordered headings and no em or en dashes", () => {
    const { container } = render(<SecurityPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)));
    levels.slice(1).forEach((level, index) => {
      expect(level - levels[index]).toBeLessThanOrEqual(1);
    });
  });

  it("says plainly that no scanner is running and no listing has a tier", () => {
    render(<SecurityPage />);
    expect(
      screen.getByText(/This is a design specification\. No security scanner is running today, so no listing on this site has a tier\./),
    ).toBeInTheDocument();
  });

  it("explains that Source verified is not a security review", () => {
    render(<SecurityPage />);
    expect(screen.getByText(/Source verified is not a security review/)).toBeInTheDocument();
    expect(screen.getByText(/responded with HTTP 200/)).toBeInTheDocument();
  });

  it("lists all four tiers and marks each behavior as proposed", () => {
    render(<SecurityPage />);
    for (const tier of ["TIER_A", "TIER_B", "TIER_C", "REVOKED"]) {
      expect(screen.getByText(tier)).toBeInTheDocument();
    }
    expect(screen.getAllByText("Proposed CLI behavior")).toHaveLength(4);
  });

  it("renders the four-step scan pipeline as an ordered timeline", () => {
    render(<SecurityPage />);
    const pipeline = screen.getByRole("list", { name: "Proposed scan pipeline" });
    expect(pipeline.tagName).toBe("OL");
    expect(within(pipeline).getAllByRole("heading", { level: 4 })).toHaveLength(4);
  });

  it("gives practical pre-install guidance under a linkable section", () => {
    const { container } = render(<SecurityPage />);
    const section = container.querySelector("#before-you-install");
    expect(section).not.toBeNull();
    for (const title of ["Read the source", "Check the publisher", "Review permissions and hooks", "Prefer pinned versions"]) {
      expect(within(section as HTMLElement).getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });

  it("exports page metadata with a canonical path", () => {
    expect(metadata.alternates?.canonical).toBe("/security/");
    expect(metadata.title).toBe("Security");
  });
});
