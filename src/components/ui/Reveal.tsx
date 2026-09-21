"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export interface RevealProps {
  readonly children: ReactNode;
  /** Seconds to wait before the reveal starts; use it to stagger siblings. */
  readonly delay?: number;
  readonly className?: string;
}

const REVEAL_OFFSET_PX = 16;

/**
 * When a wrapper counts as "in view". `amount: "some"` means any part of it: a fraction such as 0.2
 * can never be reached by a wrapper taller than five viewports, so a long section (the Hooks page's
 * 125 event rows are over 12,000px) would stay at opacity 0 for good. The negative bottom margin
 * keeps the fade from starting until the wrapper is a little way inside the window.
 */
export const REVEAL_VIEWPORT = { once: true, amount: "some", margin: "0px 0px -64px 0px" } as const;

/**
 * Fades and lifts content into place once when it scrolls into view. The initial state is
 * identical on server and client (no hydration mismatch); reduced-motion users get the same
 * end state with a zero-length transition. `data-reveal` lets the layout's noscript rule
 * keep content visible when scripts are disabled.
 */
export function Reveal({ children, delay = 0, className }: RevealProps): ReactNode {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET_PX }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={
        shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
