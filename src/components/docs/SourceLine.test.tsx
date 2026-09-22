import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceLine } from "./SourceLine";

describe("SourceLine", () => {
  it("names each source as a safe external link, separated by commas", () => {
    const { container } = render(
      <SourceLine
        sources={[
          { label: "Mods README", href: "https://github.com/anthropics/claude-code/blob/main/mods/README.md" },
          { label: "Hooks docs", href: "https://code.claude.com/docs/en/hooks" },
        ]}
      />,
    );
    expect(container.textContent).toMatch(/^Source: Mods README.*, Hooks docs/);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a single source without a separator", () => {
    const { container } = render(<SourceLine sources={[{ label: "Hooks docs", href: "https://code.claude.com/docs/en/hooks" }]} />);
    expect(container.textContent).not.toContain(",");
  });

  it("renders nothing for no sources, rather than a blank Source label", () => {
    const { container } = render(<SourceLine sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("refuses an unsafe link instead of rendering it", () => {
    expect(() => render(<SourceLine sources={[{ label: "x", href: "javascript:alert(1)" }]} />)).toThrow(/Unsafe href/);
  });
});
