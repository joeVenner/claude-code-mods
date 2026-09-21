import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EXTENSION_KINDS } from "@/lib/types";
import { KIND_ICONS, KindIcon } from "./KindIcon";

describe("KindIcon", () => {
  it("maps every extension kind to a distinct icon", () => {
    const icons = EXTENSION_KINDS.map((kind) => KIND_ICONS[kind]);
    expect(icons.every((icon) => icon !== undefined)).toBe(true);
    expect(new Set(icons).size).toBe(EXTENSION_KINDS.length);
  });

  it("renders a decorative svg", () => {
    const { container } = render(<KindIcon kind="agent" size={20} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("width", "20");
  });
});
