import type { ReactNode } from "react";
import { BRAND_COLORS, MARK_CORNER_RADIUS, MARK_SIZE, markGlyphPolygons, polygonsToPathData } from "@/lib/seo/brandMark";

export interface BrandMarkProps {
  /** Rendered side length in pixels. */
  readonly size: number;
  /** False draws a full-bleed square for maskable icons, which platforms crop themselves. */
  readonly isRounded?: boolean;
  /** Scales the prompt about the centre; maskable icons pass a value below 1 for the safe zone. */
  readonly glyphScale?: number;
  /** Tile opacity multiplier, used for the large faint mark behind the share banner. */
  readonly opacity?: number;
}

/**
 * The brand mark as an inline SVG: an accent green tile holding a `>_` prompt. Used only inside
 * generated images (`ImageResponse`), where it must be self-contained.
 */
export function BrandMark({ size, isRounded = true, glyphScale = 1, opacity = 1 }: BrandMarkProps): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      opacity={opacity}
    >
      <rect width={MARK_SIZE} height={MARK_SIZE} rx={isRounded ? MARK_CORNER_RADIUS : 0} fill={BRAND_COLORS.accent} />
      <path d={polygonsToPathData(markGlyphPolygons(glyphScale))} fill={BRAND_COLORS.onAccent} />
    </svg>
  );
}
