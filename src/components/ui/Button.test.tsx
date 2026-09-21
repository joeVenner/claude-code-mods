import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a real button that defaults to type=button", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("whitespace-nowrap");
  });

  it("calls onClick and respects disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders an internal link without target or rel", () => {
    render(<Button href="/browse/">Browse</Button>);
    const link = screen.getByRole("link", { name: "Browse" });
    expect(link.getAttribute("href")).toMatch(/^\/browse\/?$/);
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("opens external https links in a new tab with noopener noreferrer", () => {
    render(<Button href="https://example.com/repo">Source</Button>);
    const link = screen.getByRole("link", { name: /Source/ });
    expect(link).toHaveAttribute("href", "https://example.com/repo");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("(opens in a new tab)");
  });

  it("does not let caller props drop noopener or the new-tab target on external links", () => {
    render(
      <Button href="https://github.com/anthropics" rel="opener" target="_self">
        Source
      </Button>,
    );
    const link = screen.getByRole("link", { name: /Source/ });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it.each([
    "mailto:hello@example.com",
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.example/path",
    "http://plain-http.example",
    "relative/path",
  ])("rejects the unsafe href %s", (href) => {
    expect(() => render(<Button href={href}>Bad</Button>)).toThrow(/Unsafe href rejected/);
  });

  it("applies variant and size classes and renders icons", () => {
    render(
      <Button variant="primary" size="lg" iconLeft={<span data-testid="left" />} iconRight={<span data-testid="right" />}>
        Publish
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Publish" });
    expect(button).toHaveClass("bg-accent", "text-accent-fg", "min-h-12", "active:scale-[0.98]");
    expect(screen.getByTestId("left")).toBeInTheDocument();
    expect(screen.getByTestId("right")).toBeInTheDocument();
  });
});
