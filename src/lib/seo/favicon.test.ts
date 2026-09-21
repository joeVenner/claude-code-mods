// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const HEADER_BYTES = 6;
const ENTRY_BYTES = 16;

/** The committed file, produced once by `scripts/make-favicon.mjs`. */
const icoBytes = readFileSync(path.join(process.cwd(), "src", "app", "favicon.ico"));

describe("src/app/favicon.ico", () => {
  it("starts with an ICO header holding three images", () => {
    expect(icoBytes.readUInt16LE(0)).toBe(0);
    expect(icoBytes.readUInt16LE(2)).toBe(1);
    expect(icoBytes.readUInt16LE(4)).toBe(3);
  });

  it("lists 16, 32 and 48 pixel 32-bit images", () => {
    const sizes: number[] = [];
    for (let index = 0; index < 3; index++) {
      const entryOffset = HEADER_BYTES + index * ENTRY_BYTES;
      expect(icoBytes[entryOffset + 1]).toBe(icoBytes[entryOffset]);
      expect(icoBytes.readUInt16LE(entryOffset + 4)).toBe(1);
      expect(icoBytes.readUInt16LE(entryOffset + 6)).toBe(32);
      sizes.push(icoBytes[entryOffset]);
    }
    expect(sizes).toEqual([16, 32, 48]);
  });

  it("stores each image as a PNG of the size its entry declares, inside the file", () => {
    for (let index = 0; index < 3; index++) {
      const entryOffset = HEADER_BYTES + index * ENTRY_BYTES;
      const declaredSize = icoBytes[entryOffset];
      const byteLength = icoBytes.readUInt32LE(entryOffset + 8);
      const imageOffset = icoBytes.readUInt32LE(entryOffset + 12);
      expect(imageOffset + byteLength).toBeLessThanOrEqual(icoBytes.length);
      expect(icoBytes.subarray(imageOffset, imageOffset + 8).equals(PNG_SIGNATURE)).toBe(true);
      // IHDR holds width then height right after the 8 byte signature and 8 bytes of chunk header.
      expect(icoBytes.readUInt32BE(imageOffset + 16)).toBe(declaredSize);
      expect(icoBytes.readUInt32BE(imageOffset + 20)).toBe(declaredSize);
    }
  });

  it("ends exactly where the last image ends", () => {
    const lastEntryOffset = HEADER_BYTES + 2 * ENTRY_BYTES;
    const end = icoBytes.readUInt32LE(lastEntryOffset + 12) + icoBytes.readUInt32LE(lastEntryOffset + 8);
    expect(end).toBe(icoBytes.length);
  });
});
