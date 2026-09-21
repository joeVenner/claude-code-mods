import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ImageResponse } from "next/og";

/**
 * Fonts for generated share images and icons. `ImageResponse` cannot use the CSS fonts of the
 * page, so it needs font files.
 *
 * Geist and Geist Mono are licensed under the SIL Open Font License 1.1; the license text sits
 * next to the files as `src/assets/fonts/OFL.txt`. Source: https://github.com/vercel/geist-font at
 * commit 10dc7658f13c38a474cde201bb09a4617267545b, files
 * `fonts/Geist/ttf/Geist-Regular.ttf`, `fonts/Geist/ttf/Geist-SemiBold.ttf` and
 * `fonts/GeistMono/ttf/GeistMono-Medium.ttf`, unmodified.
 *
 * Server only: this module reads the file system at build time.
 */

type OgOptions = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>;
export type OgFont = NonNullable<OgOptions["fonts"]>[number];

export const BRAND_FONT_FAMILY = "Geist";
export const BRAND_MONO_FONT_FAMILY = "Geist Mono";

const FONT_DIRECTORY = path.join(process.cwd(), "src", "assets", "fonts");

let cachedFonts: Promise<readonly OgFont[]> | undefined;

async function readFont(fileName: string): Promise<ArrayBuffer> {
  const file = await readFile(path.join(FONT_DIRECTORY, fileName));
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
}

/** Geist 400 and 600, and Geist Mono 500. Read once per build process and shared by every image. */
export function loadBrandFonts(): Promise<readonly OgFont[]> {
  cachedFonts ??= Promise.all([
    readFont("Geist-Regular.ttf"),
    readFont("Geist-SemiBold.ttf"),
    readFont("GeistMono-Medium.ttf"),
  ]).then(([regular, semiBold, mono]): readonly OgFont[] => [
    { name: BRAND_FONT_FAMILY, data: regular, weight: 400, style: "normal" },
    { name: BRAND_FONT_FAMILY, data: semiBold, weight: 600, style: "normal" },
    { name: BRAND_MONO_FONT_FAMILY, data: mono, weight: 500, style: "normal" },
  ]);
  return cachedFonts;
}
