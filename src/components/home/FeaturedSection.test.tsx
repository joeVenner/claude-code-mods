import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { HOME_FIXTURES } from "./__fixtures__/extensions";
import { FeaturedSection } from "./FeaturedSection";
import { stubIntersectionObserver } from "./__fixtures__/intersection-observer";

describe("FeaturedSection", () => {
  beforeAll(stubIntersectionObserver);

  it("renders the lead with extra description text and the rest as cards", () => {
    const [lead, second, third] = HOME_FIXTURES;
    render(<FeaturedSection extensions={[lead, second, third]} />);

    expect(screen.getByRole("heading", { level: 2, name: "Featured entries" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: lead.name })).toBeInTheDocument();
    expect(screen.getByText(lead.description[0])).toBeInTheDocument();
    expect(screen.getByText("PreToolUse")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: second.name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: third.name })).toBeInTheDocument();
    // Supporting entries do not repeat the long description.
    expect(screen.queryByText(second.description[0])).not.toBeInTheDocument();
  });

  it("renders a lone lead without a supporting list", () => {
    render(<FeaturedSection extensions={[HOME_FIXTURES[0]]} />);
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<FeaturedSection extensions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
