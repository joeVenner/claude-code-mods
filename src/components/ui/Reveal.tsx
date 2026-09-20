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
      viewport={{ once: true, amount: 0.2 }}
      transition={
        shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
