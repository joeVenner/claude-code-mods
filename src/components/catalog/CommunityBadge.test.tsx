import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { COMMUNITY_LISTING_NOTE, CommunityBadge } from "./CommunityBadge";

describe("CommunityBadge", () => {
  it("labels community publishers and explains it in the tooltip", () => {
    const { container } = render(<CommunityBadge publisher={{ kind: "community" }} />);
    expect(screen.getByText("Community listing")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("title", COMMUNITY_LISTING_NOTE);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it.each(["anthropic", "mcp-project"] as const)("renders nothing for %s publishers", (kind) => {
    const { container } = render(<CommunityBadge publisher={{ kind }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("has a note without dashes", () => {
    expect(COMMUNITY_LISTING_NOTE).not.toMatch(/[–—]/);
    expect(COMMUNITY_LISTING_NOTE).toBe(
      "Community listing. Not published by Anthropic; a maintainer read the entry, not the code.",
    );
  });
});
