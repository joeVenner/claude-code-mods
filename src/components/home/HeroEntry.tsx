"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export interface HeroEntryProps {
  readonly children: ReactNode;
  /** Position in the entry sequence; each step waits a little longer than the one before. */
  readonly order: number;
  readonly className?: string;
}

const ENTRY_OFFSET_PX = 14;
const ENTRY_STEP_SECONDS = 0.08;

/**
 * Staggers the hero's first paint so the eye lands on the headline, then the actions, then the
 * search panel. The initial state is the same on server and client; reduced-motion users get the
 * final state with a zero-length transition. `data-reveal` keeps content visible without scripts.
 */
export function HeroEntry({ children, order, className }: HeroEntryProps): ReactNode {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: ENTRY_OFFSET_PX }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.5, delay: order * ENTRY_STEP_SECONDS, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
