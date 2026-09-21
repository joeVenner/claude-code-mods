// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RENDERABLE_RANGES, toRenderableText } from "./previewContent";

/** Code points a TrueType file maps to a glyph, read from its cmap (formats 4 and 12). */
function mappedCodePoints(fileName: string): ReadonlySet<number> {
  const bytes = readFileSync(path.join(process.cwd(), "src", "assets", "fonts", fileName));
  const tableCount = bytes.readUInt16BE(4);
  let cmapOffset = 0;
  for (let index = 0; index < tableCount; index++) {
    const record = 12 + index * 16;
    if (bytes.toString("ascii", record, record + 4) === "cmap") cmapOffset = bytes.readUInt32BE(record + 8);
  }
  const mapped = new Set<number>();
  const subtableCount = bytes.readUInt16BE(cmapOffset + 2);
  for (let index = 0; index < subtableCount; index++) {
    const subtable = cmapOffset + bytes.readUInt32BE(cmapOffset + 4 + index * 8 + 4);
    const format = bytes.readUInt16BE(subtable);
    if (format === 12) {
      const groups = bytes.readUInt32BE(subtable + 12);
      for (let group = 0; group < groups; group++) {
        const at = subtable + 16 + group * 12;
        for (let code = bytes.readUInt32BE(at); code <= bytes.readUInt32BE(at + 4); code++) mapped.add(code);
      }
    }
    if (format !== 4) continue;
    const segmentBytes = bytes.readUInt16BE(subtable + 6);
    const endCodes = subtable + 14;
    const startCodes = endCodes + segmentBytes + 2;
    const deltas = startCodes + segmentBytes;
    const rangeOffsets = deltas + segmentBytes;
    for (let segment = 0; segment < segmentBytes / 2; segment++) {
      const end = bytes.readUInt16BE(endCodes + segment * 2);
      const start = bytes.readUInt16BE(startCodes + segment * 2);
      const rangeOffset = bytes.readUInt16BE(rangeOffsets + segment * 2);
      for (let code = start; code <= end && code !== 0xffff; code++) {
        const glyph =
          rangeOffset === 0
            ? (code + bytes.readInt16BE(deltas + segment * 2)) & 0xffff
            : bytes.readUInt16BE(rangeOffsets + segment * 2 + rangeOffset + (code - start) * 2);
        if (glyph !== 0) mapped.add(code);
      }
    }
  }
  return mapped;
}

const FONT_FILES = ["Geist-Regular.ttf", "Geist-SemiBold.ttf", "GeistMono-Medium.ttf"] as const;

describe("RENDERABLE_RANGES", () => {
  it("only lists code points that every vendored font file has a glyph for", () => {
    for (const fileName of FONT_FILES) {
      const mapped = mappedCodePoints(fileName);
      for (const [first, last] of RENDERABLE_RANGES) {
        for (let code = first; code <= last; code++) expect(mapped.has(code), `${fileName} U+${code.toString(16)}`).toBe(true);
      }
    }
  });

  it("stays clear of controls, bidi marks and line separators", () => {
    const covers = (code: number): boolean => RENDERABLE_RANGES.some(([first, last]) => code >= first && code <= last);
    for (const code of [0x00, 0x09, 0x0a, 0x7f, 0x80, 0x9f, 0xad, 0x200b, 0x200d, 0x200e, 0x2028, 0x2029, 0x202a, 0x202e, 0x2066]) {
      expect(covers(code), `U+${code.toString(16)}`).toBe(false);
    }
  });
});

describe("toRenderableText", () => {
  it("keeps plain text, accented Latin letters and typographic punctuation", () => {
    expect(toRenderableText("Caf\u00e9 \u201cquoted\u201d na\u00efve")).toBe("Caf\u00e9 \u201cquoted\u201d na\u00efve");
  });

  it("drops emoji, including joined and variation-selector sequences", () => {
    const family = ["\ud83d\udc68", "\u200d", "\ud83d\udc69", "\u200d", "\ud83d\udc67"].join("");
    expect(toRenderableText(`rocket \ud83d\ude80 ${family} \u2764\ufe0f fast`)).toBe("rocket fast");
  });

  it("drops CJK and right-to-left scripts", () => {
    expect(toRenderableText("\u65e5\u672c\u8a9e tool \u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u05e2\u05d1\u05e8\u05d9\u05ea")).toBe("tool");
  });

  it("composes combining marks into a letter the font has, and drops marks it cannot compose", () => {
    expect(toRenderableText("cafe\u0301")).toBe("caf\u00e9");
    expect(toRenderableText("a\u0489b")).toBe("ab");
  });

  it("drops bidi controls and zero-width characters, and treats line separators as spaces", () => {
    expect(toRenderableText("a\u202eb\u200bc\u2028d\u2066e")).toBe("abc de");
  });

  it("turns long dashes into a hyphen and collapses whitespace, including newlines", () => {
    expect(toRenderableText("one\u2014two\n\nthree\u00a0four")).toBe("one - two three four");
  });

  it("returns an empty string when nothing can be drawn", () => {
    expect(toRenderableText("\ud83d\ude80\ud83d\ude80")).toBe("");
    expect(toRenderableText("")).toBe("");
  });
});
