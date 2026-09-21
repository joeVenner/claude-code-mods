import { PRODUCTION_SITE_URL, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { KIND_LABELS, type Extension } from "@/lib/types";
import { PAGE_SEO } from "@/lib/seo/pages";
import { clampText, indefiniteArticle, lowerCaseLabel, toSingleLine } from "@/lib/seo/text";

/**
 * What a link preview image says, as plain strings. Catalog text can come from community pull
 * requests, so it is clamped here and only ever rendered as text nodes, never as markup.
 */

export const PREVIEW_IMAGE_SIZE = { width: 1200, height: 630 } as const;
export const PREVIEW_IMAGE_CONTENT_TYPE = "image/png";
/** Host shown on the site banner. Fixed to production so a preview built locally does not say localhost. */
export const PREVIEW_HOST = new URL(PRODUCTION_SITE_URL).host;

/** Alt text of the site-wide banner. */
export const SITE_BANNER_ALT = `${SITE_NAME}: ${SITE_TAGLINE}`;

export const MAX_PREVIEW_NAME_LENGTH = 64;
export const MAX_PREVIEW_SUMMARY_LENGTH = 150;
export const MAX_PREVIEW_PUBLISHER_LENGTH = 40;

export interface PreviewContent {
  /** Upper-case label in the top corner, such as "MOD" or "MCP SERVER". */
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  /** Left footer text, for example "By Anthropic". Empty when there is nothing to say. */
  readonly byline: string;
  /** Short tags such as "Built in" or "Community listing". */
  readonly tags: readonly string[];
  /** Alt text for the image, also used as `og:image:alt`. */
  readonly alt: string;
}

/**
 * Code point ranges that the three vendored Geist files all have glyphs for: Basic Latin, Latin-1
 * Supplement (without the invisible soft hyphen), the covered parts of Latin Extended-A and
 * Extended-B, and general punctuation limited to dashes, quotes, bullet, ellipsis and primes.
 * `next/og` fetches emoji and fallback fonts from a CDN at build time for anything else, which can
 * fail the build or draw empty boxes, so other characters are dropped. Bidi controls and the line
 * and paragraph separators (U+2028 to U+202F) are excluded on purpose. A test compares these
 * ranges with the font files' character maps, so a font update cannot silently break them.
 */
export const RENDERABLE_RANGES: readonly (readonly [number, number])[] = [
  [0x20, 0x7e],
  [0xa0, 0xac],
  [0xae, 0xff],
  [0x100, 0x113],
  [0x116, 0x12b],
  [0x12e, 0x131],
  [0x134, 0x137],
  [0x139, 0x13e],
  [0x141, 0x148],
  [0x14a, 0x14d],
  [0x150, 0x17e],
  [0x18f, 0x18f],
  [0x192, 0x192],
  [0x1a0, 0x1a1],
  [0x1af, 0x1b0],
  [0x1cd, 0x1ce],
  [0x1e4, 0x1e9],
  [0x218, 0x21b],
  [0x237, 0x237],
  [0x2013, 0x2014],
  [0x2018, 0x201a],
  [0x201c, 0x201e],
  [0x2020, 0x2022],
  [0x2026, 0x2026],
  [0x2030, 0x2030],
  [0x2032, 0x2033],
  [0x2039, 0x203a],
];

function isRenderable(codePoint: number): boolean {
  return RENDERABLE_RANGES.some(([first, last]) => codePoint >= first && codePoint <= last);
}

/**
 * One line of text that the preview fonts can draw: composed to NFC first (so "e" plus a combining
 * accent becomes one letter), then every other character, emoji, CJK, right-to-left and combining
 * marks included, is dropped.
 */
export function toRenderableText(text: string): string {
  const kept = Array.from(toSingleLine(text).normalize("NFC"))
    .filter((character) => isRenderable(character.codePointAt(0) ?? 0))
    .join("");
  return kept.replace(/\s+/g, " ").trim();
}

/** Content for an extension's preview image. Falls back to the slug when no character of the name can be drawn. */
export function buildEntryPreviewContent(
  extension: Pick<Extension, "slug" | "name" | "kind" | "summary" | "publisher" | "availability">,
): PreviewContent {
  const name = clampText(toRenderableText(extension.name), MAX_PREVIEW_NAME_LENGTH) || extension.slug;
  const publisherName = clampText(toRenderableText(extension.publisher.name), MAX_PREVIEW_PUBLISHER_LENGTH);
  const kindLabel = KIND_LABELS[extension.kind];
  const kindWords = lowerCaseLabel(kindLabel);
  const tags: string[] = [];
  if (extension.availability === "built-in") tags.push("Built in");
  if (extension.publisher.kind === "community") tags.push("Community listing");
  return {
    eyebrow: kindLabel.toUpperCase(),
    title: name,
    summary: clampText(toRenderableText(extension.summary), MAX_PREVIEW_SUMMARY_LENGTH),
    byline: publisherName === "" ? "" : `By ${publisherName}`,
    tags,
    alt: `${name}, ${indefiniteArticle(kindWords)} ${kindWords} listed in the ${SITE_NAME} directory.`,
  };
}

/** Content for the Ideas page preview. `ideaCount` comes from the ideas file, never a literal. */
export function buildIdeasPreviewContent(ideaCount: number): PreviewContent {
  return {
    eyebrow: "IDEAS",
    title: "Proposed mods, not real yet",
    summary: `${ideaCount} proposals from the marketplace spec with no public implementation. They cannot be installed.`,
    byline: "",
    tags: ["Not installable"],
    alt: PAGE_SEO.ideas.previewImage.alt,
  };
}

/** Title font size in pixels for a name of `length` characters, so long names still fit two lines. */
export function previewTitleFontSize(length: number): number {
  if (length <= 22) return 80;
  if (length <= 34) return 68;
  if (length <= 48) return 56;
  return 48;
}
