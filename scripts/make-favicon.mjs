#!/usr/bin/env node
/**
 * Builds src/app/favicon.ico (an ICO container holding 16, 32 and 48 px PNG images) from the brand
 * mark geometry in src/lib/seo/brandMark.ts. Run it once and commit the output:
 *
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/make-favicon.mjs
 *
 * It has no dependencies: shapes are rasterised here with supersampling, and PNGs are encoded with
 * node:zlib. Node 22.18 or newer runs the imported .ts file directly (type stripping); the flag
 * only silences Node's note that package.json has no "type" field.
 */
import { writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { BRAND_COLORS, MARK_CORNER_RADIUS, MARK_SIZE, markGlyphPolygons } from "../src/lib/seo/brandMark.ts";

const ICON_SIZES = [16, 32, 48];
/** Sub-samples per pixel edge. 8 x 8 keeps the 16 px icon smooth without a real anti-aliasing filter. */
const SAMPLES = 8;
const OUTPUT_PATH = fileURLToPath(new URL("../src/app/favicon.ico", import.meta.url));

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const ACCENT = hexToRgb(BRAND_COLORS.accent);
const ON_ACCENT = hexToRgb(BRAND_COLORS.onAccent);
const GLYPH = markGlyphPolygons();

/** Even-odd point in polygon test. */
function isInsidePolygon(x, y, polygon) {
  let isInside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) isInside = !isInside;
  }
  return isInside;
}

function isInsideRoundedSquare(x, y) {
  const radius = MARK_CORNER_RADIUS;
  if (x < 0 || y < 0 || x > MARK_SIZE || y > MARK_SIZE) return false;
  const cornerX = x < radius ? radius : x > MARK_SIZE - radius ? MARK_SIZE - radius : x;
  const cornerY = y < radius ? radius : y > MARK_SIZE - radius ? MARK_SIZE - radius : y;
  return (x - cornerX) ** 2 + (y - cornerY) ** 2 <= radius ** 2;
}

/** RGBA pixels for one icon size: alpha comes from tile coverage, colour from tile or glyph. */
function renderPixels(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const unitsPerSample = MARK_SIZE / (size * SAMPLES);
  for (let pixelY = 0; pixelY < size; pixelY++) {
    for (let pixelX = 0; pixelX < size; pixelX++) {
      let tileHits = 0;
      let glyphHits = 0;
      for (let sampleY = 0; sampleY < SAMPLES; sampleY++) {
        for (let sampleX = 0; sampleX < SAMPLES; sampleX++) {
          const x = (pixelX * SAMPLES + sampleX + 0.5) * unitsPerSample;
          const y = (pixelY * SAMPLES + sampleY + 0.5) * unitsPerSample;
          if (!isInsideRoundedSquare(x, y)) continue;
          tileHits++;
          if (GLYPH.some((polygon) => isInsidePolygon(x, y, polygon))) glyphHits++;
        }
      }
      const totalSamples = SAMPLES * SAMPLES;
      const offset = (pixelY * size + pixelX) * 4;
      if (tileHits === 0) continue;
      const glyphShare = glyphHits / tileHits;
      for (let channel = 0; channel < 3; channel++) {
        pixels[offset + channel] = Math.round(ACCENT[channel] * (1 - glyphShare) + ON_ACCENT[channel] * glyphShare);
      }
      pixels[offset + 3] = Math.round((tileHits / totalSamples) * 255);
    }
  }
  return pixels;
}

function pngChunk(type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, checksum]);
}

/** Straight (non-premultiplied) RGBA PNG, filter type 0 on every scanline. */
function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  const scanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let row = 0; row < size; row++) {
    pixels.copy(scanlines, row * (size * 4 + 1) + 1, row * size * 4, (row + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/** ICONDIR, one ICONDIRENTRY per image, then the PNG payloads. */
function encodeIco(images) {
  const directory = Buffer.alloc(6);
  directory.writeUInt16LE(0, 0); // reserved
  directory.writeUInt16LE(1, 2); // type: icon
  directory.writeUInt16LE(images.length, 4);
  const entries = Buffer.alloc(16 * images.length);
  let payloadOffset = directory.length + entries.length;
  images.forEach(({ size, png }, index) => {
    const entryOffset = index * 16;
    entries[entryOffset] = size; // width (0 would mean 256)
    entries[entryOffset + 1] = size; // height
    entries.writeUInt16LE(1, entryOffset + 4); // colour planes
    entries.writeUInt16LE(32, entryOffset + 6); // bits per pixel
    entries.writeUInt32LE(png.length, entryOffset + 8);
    entries.writeUInt32LE(payloadOffset, entryOffset + 12);
    payloadOffset += png.length;
  });
  return Buffer.concat([directory, entries, ...images.map(({ png }) => png)]);
}

const images = ICON_SIZES.map((size) => ({ size, png: encodePng(size, renderPixels(size)) }));
const ico = encodeIco(images);
writeFileSync(OUTPUT_PATH, ico);
console.log(`Wrote ${OUTPUT_PATH} (${ico.length} bytes, sizes ${ICON_SIZES.join(", ")})`);
