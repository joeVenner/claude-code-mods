"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { ExtensionCard } from "@/components/catalog/ExtensionCard";
import type { Extension } from "@/lib/types";
import { RESULTS_GRID_CLASSES } from "./layout";

export interface ResultsGridProps {
  readonly items: readonly Extension[];
}

const ENTER_OFFSET_PX = 8;
const ENTER_DURATION_SECONDS = 0.2;

/**
 * Cards are keyed by slug, so a card that stays in the results keeps its element and does not
 * re-animate; only entries that newly appear fade and lift in. There is no exit or layout
 * animation, which keeps typing cheap. `initial={false}` on the presence wrapper skips the
 * animation for the first render, and reduced-motion users never get one.
 */
export function ResultsGrid({ items }: ResultsGridProps): ReactNode {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ul className={RESULTS_GRID_CLASSES}>
      <AnimatePresence initial={false}>
        {items.map((extension) => (
          <motion.li
            key={extension.slug}
            className="min-w-0"
            initial={shouldReduceMotion ? false : { opacity: 0, y: ENTER_OFFSET_PX }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : ENTER_DURATION_SECONDS, ease: [0.16, 1, 0.3, 1] }}
          >
            <ExtensionCard extension={extension} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
