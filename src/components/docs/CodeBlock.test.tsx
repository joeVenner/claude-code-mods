import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  it("shows the code exactly, keeping its lines and indentation", () => {
    const code = "export function register(on: On) {\n  on('tool.call', ($, e, next) => next(e))\n}";
    const { container } = render(<CodeBlock code={code} />);
    expect(container.querySelector("code")?.textContent).toBe(code);
  });

  it("captions the block with its file name and names the region for assistive tech", () => {
    render(<CodeBlock code="{}" filename="hooks/hooks.json" />);
    expect(screen.getByText("hooks/hooks.json")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Contents of hooks/hooks.json" })).toBeInTheDocument();
  });

  it("has no caption without a file name", () => {
    const { container } = render(<CodeBlock code="x" />);
    expect(container.querySelector("figcaption")).toBeNull();
    expect(screen.getByRole("group", { name: "Code" })).toBeInTheDocument();
  });

  it("can be focused, so a keyboard user can scroll a long line", () => {
    render(<CodeBlock code={"x".repeat(500)} />);
    expect(screen.getByRole("group", { name: "Code" })).toHaveAttribute("tabindex", "0");
  });

  it("names a block that has no file name from its label", () => {
    render(<CodeBlock code="a/" label="Folder layout of the starter mod" />);
    expect(screen.getByRole("group", { name: "Folder layout of the starter mod" })).toBeInTheDocument();
  });

  it("renders markup in the code as text, never as elements", () => {
    const { container } = render(<CodeBlock code={'<script>alert("x")</script><img src=x onerror=alert(1)>'} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("code")?.textContent).toContain("<script>");
  });
});
