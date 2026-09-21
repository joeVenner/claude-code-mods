import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { verifiedExtension } from "./__fixtures__/extensions";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("labels entries as source verified and explains what that means", () => {
    const { container } = render(<StatusBadge verification={verifiedExtension.verification} />);
    expect(screen.getByText("Source verified")).toBeInTheDocument();
    const badge = container.firstElementChild;
    expect(badge).toHaveAttribute("title", "Source URL responded on 2026-05-02. Not a security review.");
    expect(badge).toHaveTextContent("Not a security review.");
    expect(badge?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("never mentions concepts or scanning", () => {
    const { container } = render(<StatusBadge verification={verifiedExtension.verification} />);
    expect(container.textContent ?? "").not.toMatch(/concept|scanned|reviewed by/i);
  });
});
