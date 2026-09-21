import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextLink } from "@/components/docs/TextLink";

describe("TextLink", () => {
  it("opens an external https link in a new tab without leaking the opener", () => {
    render(<TextLink href="https://code.claude.com/docs/en/plugins">Plugin docs</TextLink>);
    const link = screen.getByRole("link", { name: /Plugin docs/ });
    expect(link).toHaveAttribute("href", "https://code.claude.com/docs/en/plugins");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("(opens in a new tab)");
  });

  it("renders an internal path as a same-tab link", () => {
    render(<TextLink href="/security/">Security</TextLink>);
    const link = screen.getByRole("link", { name: "Security" });
    expect(link.getAttribute("href")).toMatch(/^\/security\/?$/);
    expect(link).not.toHaveAttribute("target");
  });

  it.each(["javascript:alert(1)", "data:text/html,x", "http://plain.example", "//evil.example", "about"])(
    "throws for the unsafe href %s",
    (href) => {
      expect(() => render(<TextLink href={href}>Bad</TextLink>)).toThrow(/Unsafe href rejected/);
    },
  );
});
