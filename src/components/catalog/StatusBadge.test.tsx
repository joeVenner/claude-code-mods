import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { conceptExtension, verifiedExtension } from "./__fixtures__/extensions";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("labels verified entries as source verified and explains what that means", () => {
    const { container } = render(<StatusBadge verification={verifiedExtension.verification} />);
    expect(screen.getByText("Source verified")).toBeInTheDocument();
    const badge = container.firstElementChild;
    expect(badge).toHaveAttribute("title", "Source URL responded on 2026-05-02. Not a security review.");
    expect(badge).toHaveTextContent("Not a security review.");
    expect(badge?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("labels concepts with a dashed border and never uses verified wording", () => {
    const { container } = render(<StatusBadge verification={conceptExtension.verification} />);
    const badge = container.firstElementChild;
    expect(screen.getByText("Concept")).toBeInTheDocument();
    expect(badge).toHaveClass("border-dashed");
    expect(badge).toHaveAttribute("title", "Proposed design, no public implementation.");
    expect(badge?.textContent ?? "").not.toMatch(/verified/i);
    expect(badge?.getAttribute("title") ?? "").not.toMatch(/verified/i);
  });
});
