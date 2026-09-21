/**
 * Geometry and colours of the brand mark: a rounded square in the accent green holding a terminal
 * prompt (`>_`). This file is plain data with no imports on purpose, so the same numbers feed the
 * React icons (`src/components/seo`) and `scripts/make-favicon.mjs`, which Node loads directly.
 *
 * The prompt is drawn as polygons instead of typeset in Geist Mono: at 16px a font glyph is blurred
 * by hinting, and drawn shapes render identically in the favicon, the icons and the share banner.
 * The proportions follow Geist Mono's `>` and `_`.
 */

/** Palette values copied from `src/app/globals.css` (dark theme). Keep them in sync by hand. */
export const BRAND_COLORS = {
  background: "#0c0d0e",
  surface: "#131517",
  border: "#262a2e",
  borderStrong: "#363b41",
  foreground: "#e7e9ea",
  muted: "#9aa1a8",
  accent: "#5fd38d",
  onAccent: "#07130c",
} as const;

export type Point = readonly [number, number];
export type Polygon = readonly Point[];

/** Side of the square the geometry below is drawn in. */
export const MARK_SIZE = 64;
/** Corner radius of the tile, in `MARK_SIZE` units. */
export const MARK_CORNER_RADIUS = 14;

const MARK_CENTER = MARK_SIZE / 2;

/** Chevron with vertical cut ends, then the underscore, both in `MARK_SIZE` units. */
const GLYPH_POLYGONS: readonly Polygon[] = [
  [
    [11.6, 14.6],
    [37.4, 32],
    [11.6, 49.4],
    [11.6, 38.6],
    [21.4, 32],
    [11.6, 25.4],
  ],
  [
    [40.4, 41],
    [52.4, 41],
    [52.4, 49.4],
    [40.4, 49.4],
  ],
];

/**
 * The prompt polygons scaled about the tile centre. A maskable icon passes a scale below 1 so the
 * glyph stays inside the 80% safe zone that platforms crop to.
 */
export function markGlyphPolygons(scale: number = 1): readonly Polygon[] {
  return GLYPH_POLYGONS.map((polygon) =>
    polygon.map(
      ([x, y]): Point => [
        roundTo(MARK_CENTER + (x - MARK_CENTER) * scale, 3),
        roundTo(MARK_CENTER + (y - MARK_CENTER) * scale, 3),
      ],
    ),
  );
}

/** SVG path data (`M x y L ... Z`) for the given polygons. */
export function polygonsToPathData(polygons: readonly Polygon[]): string {
  return polygons
    .map((polygon) => `${polygon.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ")} Z`)
    .join(" ");
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
