import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { builtInModExtension, sourceOnlyExtension, verifiedExtension } from "./__fixtures__/extensions";
import { ExtensionCard } from "./ExtensionCard";
import { ExtensionRow } from "./ExtensionRow";

describe.each([
  ["ExtensionCard", ExtensionCard],
  ["ExtensionRow", ExtensionRow],
] as const)("%s", (_name, Component) => {
  it("links the name to the detail page", () => {
    render(<Component extension={verifiedExtension} />);
    // next/link adds the trailing slash only in the exported build, so accept both forms here.
    expect(screen.getByRole("link", { name: "Fixture Lint Runner" }).getAttribute("href")).toMatch(
      /^\/extensions\/fixture-lint-runner\/?$/,
    );
  });

  it("shows kind, summary, status and at most two category chips", () => {
    render(<Component extension={verifiedExtension} />);
    expect(screen.getByText("Plugin")).toBeInTheDocument();
    expect(screen.getByText(verifiedExtension.summary)).toBeInTheDocument();
    expect(screen.getByText("Source verified")).toBeInTheDocument();
    expect(screen.getByText("Quality")).toBeInTheDocument();
    expect(screen.getByText("Development")).toBeInTheDocument();
    expect(screen.queryByText("Workflow")).not.toBeInTheDocument();
  });

  it("shows stars with the capture date when present", () => {
    render(<Component extension={verifiedExtension} />);
    const stars = screen.getByText("1,234 stars");
    expect(stars).toHaveAttribute("title", "Captured 2026-05-01");
  });

  it("uses the singular for a single star", () => {
    render(
      <Component extension={{ ...verifiedExtension, stars: { count: 1, capturedAt: "2026-05-01" } }} />,
    );
    expect(screen.getByText("1 star")).toBeInTheDocument();
  });

  it("shows no stars when none were captured and never mentions concepts", () => {
    const { container } = render(<Component extension={sourceOnlyExtension} />);
    expect(screen.queryByText(/star/i)).not.toBeInTheDocument();
    expect(container.textContent ?? "").not.toMatch(/concept/i);
    expect(screen.getByText("Source verified")).toBeInTheDocument();
  });

  it("shows a Built in chip for built-in entries only", () => {
    const { unmount } = render(<Component extension={builtInModExtension} />);
    expect(screen.getByText("Built in")).toBeInTheDocument();
    expect(screen.getByText("Mod")).toBeInTheDocument();
    expect(screen.queryByText(/star/i)).not.toBeInTheDocument();
    unmount();

    render(<Component extension={verifiedExtension} />);
    expect(screen.queryByText("Built in")).not.toBeInTheDocument();
    expect(screen.queryByText("Installable")).not.toBeInTheDocument();
  });
});

describe.each([
  ["ExtensionCard", ExtensionCard],
  ["ExtensionRow", ExtensionRow],
] as const)("%s publisher signal", (_name, Component) => {
  it("shows a Community listing chip for community publishers", () => {
    expect(verifiedExtension.publisher.kind).toBe("community");
    render(<Component extension={verifiedExtension} />);
    expect(screen.getByText("Community listing")).toBeInTheDocument();
    expect(screen.getByText("Source verified")).toBeInTheDocument();
  });

  it("shows no community chip for Anthropic or MCP project publishers", () => {
    expect(builtInModExtension.publisher.kind).toBe("anthropic");
    const { unmount } = render(<Component extension={builtInModExtension} />);
    expect(screen.queryByText("Community listing")).not.toBeInTheDocument();
    unmount();
    render(
      <Component extension={{ ...verifiedExtension, publisher: { name: "Project", url: null, kind: "mcp-project" } }} />,
    );
    expect(screen.queryByText("Community listing")).not.toBeInTheDocument();
  });

  it("does not rely on the publisher name to say who published it", () => {
    render(
      <Component
        extension={{ ...verifiedExtension, publisher: { name: "Anthropic", url: null, kind: "community" } }}
      />,
    );
    expect(screen.getByText("Community listing")).toBeInTheDocument();
  });
});

describe("ExtensionRow active state", () => {
  it("marks the link as current only when active", () => {
    const { rerender } = render(<ExtensionRow extension={verifiedExtension} />);
    expect(screen.getByRole("link", { name: "Fixture Lint Runner" })).not.toHaveAttribute("aria-current");

    rerender(<ExtensionRow extension={verifiedExtension} isActive />);
    expect(screen.getByRole("link", { name: "Fixture Lint Runner" })).toHaveAttribute("aria-current", "true");
  });
});
