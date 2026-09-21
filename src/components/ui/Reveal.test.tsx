import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface CapturedProps {
  readonly viewport?: { readonly amount?: unknown; readonly once?: boolean; readonly margin?: string };
  readonly transition?: { readonly duration?: number };
  readonly children?: ReactNode;
}

let captured: CapturedProps = {};
let reducedMotion = false;

// jsdom has no IntersectionObserver, so the reveal itself cannot run here. What can be checked is the
// configuration the wrapper hands to Motion, which is where the bug was: see REVEAL_VIEWPORT.
vi.mock("motion/react", () => ({
  motion: {
    div: (props: CapturedProps & Record<string, unknown>) => {
      captured = props;
      return <div data-reveal="">{props.children}</div>;
    },
  },
  useReducedMotion: () => reducedMotion,
}));

const { REVEAL_VIEWPORT, Reveal } = await import("./Reveal");

beforeEach(() => {
  captured = {};
  reducedMotion = false;
});

describe("Reveal", () => {
  it("renders its children and marks itself for the noscript rule", () => {
    const { container } = render(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(container.querySelector("[data-reveal]")).not.toBeNull();
  });

  it("counts as in view when any part is on screen, never a fraction of the wrapper", () => {
    render(<Reveal>x</Reveal>);
    expect(captured.viewport).toEqual(REVEAL_VIEWPORT);
    // A numeric amount is a fraction of the wrapper's own height. Above 1 / amount viewports tall a wrapper
    // can never reach it, so it stays invisible: the 12,000px Hooks reference did exactly that at 0.2.
    expect(typeof captured.viewport?.amount).not.toBe("number");
    expect(captured.viewport?.amount).toBe("some");
  });

  it("reveals once, so scrolling back up does not hide content again", () => {
    render(<Reveal>x</Reveal>);
    expect(captured.viewport?.once).toBe(true);
  });

  it("keeps a bottom margin so the fade does not start at the window's very edge", () => {
    render(<Reveal>x</Reveal>);
    expect(captured.viewport?.margin).toMatch(/^0px 0px -\d+px 0px$/);
  });

  it("uses a zero length transition for a reader who prefers reduced motion", () => {
    reducedMotion = true;
    render(<Reveal>x</Reveal>);
    expect(captured.transition?.duration).toBe(0);
  });
});
