/**
 * Class strings shared by the live explorer and its loading skeleton, so the skeleton has the
 * same footprint and the page does not jump when the explorer replaces it.
 */

/** Single column on mobile; from md a 15rem filter rail sits beside the results. */
export const BROWSE_LAYOUT_CLASSES = "grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-[15rem_minmax(0,1fr)]";

/**
 * Columns follow the width of the results column (container queries), not the viewport, because
 * the rail takes a fixed slice from md up. The results column is about 28rem wide at md (1 column),
 * so 2 columns start at 42rem and 3 at 48rem.
 */
export const RESULTS_GRID_CLASSES = "grid grid-cols-1 gap-4 @2xl:grid-cols-2 @3xl:grid-cols-3";

/**
 * Header is 64px tall; 80px leaves a 16px gap under it. The 4px padding (offset back with a
 * negative margin) stops the scroll container from clipping focus outlines on its edges.
 */
export const RAIL_STICKY_CLASSES =
  "md:sticky md:top-20 md:-m-1 md:max-h-[calc(100dvh-6rem)] md:self-start md:overflow-y-auto md:p-1";

export const SEARCH_INPUT_ID = "browse-search";
export const BROWSE_PATH = "/browse/";
