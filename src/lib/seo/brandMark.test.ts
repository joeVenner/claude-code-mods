import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND_COLORS, MARK_SIZE, markGlyphPolygons, polygonsToPathData } from "./brandMark";

describe("markGlyphPolygons", () => {
  it("draws a chevron and an underscore inside the tile", () => {
    const polygons = markGlyphPolygons();
    expect(polygons).toHaveLength(2);
    for (const polygon of polygons) {
      for (const [x, y] of polygon) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(MARK_SIZE);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(MARK_SIZE);
      }
    }
  });

  it("keeps the scaled prompt inside the 80% maskable safe zone", () => {
    const safeRadius = MARK_SIZE * 0.4;
    for (const scale of [0.85, 0.9]) {
      for (const polygon of markGlyphPolygons(scale)) {
        for (const [x, y] of polygon) {
          const distance = Math.hypot(x - MARK_SIZE / 2, y - MARK_SIZE / 2);
          expect(distance).toBeLessThanOrEqual(safeRadius);
        }
      }
    }
  });

  it("scales about the centre and leaves the default untouched", () => {
    expect(markGlyphPolygons(1)).toEqual(markGlyphPolygons());
    const [first] = markGlyphPolygons(0.5);
    const [original] = markGlyphPolygons(1);
    expect(first[0][0]).toBeCloseTo(MARK_SIZE / 2 + (original[0][0] - MARK_SIZE / 2) * 0.5, 2);
  });
});

describe("polygonsToPathData", () => {
  it("emits one closed sub-path per polygon", () => {
    const path = polygonsToPathData([
      [
        [0, 0],
        [4, 0],
        [4, 4],
      ],
      [
        [1, 1],
        [2, 1],
        [2, 2],
      ],
    ]);
    expect(path).toBe("M0 0 L4 0 L4 4 Z M1 1 L2 1 L2 2 Z");
  });

  it("returns an empty path for no polygons", () => {
    expect(polygonsToPathData([])).toBe("");
  });
});

/** Custom properties declared in the `:root[data-theme="dark"]` block of globals.css. */
function darkThemeTokens(): ReadonlyMap<string, string> {
  const css = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
  const block = /:root\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css);
  if (block === null) throw new Error('globals.css has no :root[data-theme="dark"] block');
  return new Map([...block[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
}

describe("BRAND_COLORS", () => {
  const tokens = darkThemeTokens();

  it.each([
    ["background", "--bg"],
    ["surface", "--surface"],
    ["border", "--border"],
    ["borderStrong", "--border-strong"],
    ["foreground", "--fg"],
    ["muted", "--fg-muted"],
    ["accent", "--accent"],
    ["onAccent", "--accent-fg"],
  ] as const)("%s equals the dark theme token %s in globals.css", (name, token) => {
    expect(tokens.get(token), token).toBeDefined();
    expect(BRAND_COLORS[name].toLowerCase()).toBe(tokens.get(token)?.toLowerCase());
  });
});
