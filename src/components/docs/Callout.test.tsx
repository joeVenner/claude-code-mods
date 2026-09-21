import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Callout } from "./Callout";

describe("Callout", () => {
  it("defaults to the note tone with a visible label and an icon hidden from assistive tech", () => {
    const { container } = render(<Callout>Body text</Callout>);
    const callout = screen.getByRole("note");
    expect(callout).toHaveAttribute("data-tone", "note");
    expect(callout).toHaveTextContent("Note");
    expect(callout).toHaveTextContent("Body text");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("labels the warning tone in text so the meaning does not depend on color", () => {
    render(<Callout tone="warning">Careful</Callout>);
    const callout = screen.getByRole("note");
    expect(callout).toHaveAttribute("data-tone", "warning");
    expect(callout).toHaveTextContent("Warning");
    expect(callout).not.toHaveTextContent(/^Note/);
  });

  it("renders every child paragraph in order", () => {
    render(
      <Callout tone="warning">
        <p>First</p>
        <p>Second</p>
      </Callout>,
    );
    const text = screen.getByRole("note").textContent ?? "";
    expect(text.indexOf("First")).toBeLessThan(text.indexOf("Second"));
  });
});
