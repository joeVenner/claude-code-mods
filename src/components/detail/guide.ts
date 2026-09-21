import type { GuideSection } from "@/lib/types";

export interface GuideAnchor {
  readonly id: string;
  readonly title: string;
}

const FALLBACK_ANCHOR = "section";

/** Keeps every guide id out of the page's own id space (`main`, `install-heading`, `hooks-heading` and so on). */
export const GUIDE_ID_PREFIX = "guide-";

/** Lower-case, hyphen-separated, ASCII id for a heading. The stored title is never rewritten, only its id. */
export function slugifyHeading(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : FALLBACK_ANCHOR;
}

/**
 * One anchor per section, in order. Ids carry the `guide-` prefix. Repeated titles get `-2`, `-3`
 * suffixes so every id on the page is unique and the table of contents always points at the
 * right section.
 */
export function buildGuideAnchors(guide: readonly GuideSection[]): readonly GuideAnchor[] {
  const seen = new Map<string, number>();
  const usedIds = new Set<string>();
  return guide.map(({ title }) => {
    const base = `${GUIDE_ID_PREFIX}${slugifyHeading(title)}`;
    let occurrence = (seen.get(base) ?? 0) + 1;
    let id = occurrence === 1 ? base : `${base}-${occurrence}`;
    // A later title such as "Set up 2" could already own the suffixed id, so keep counting.
    while (usedIds.has(id)) {
      occurrence += 1;
      id = `${base}-${occurrence}`;
    }
    seen.set(base, occurrence);
    usedIds.add(id);
    return { id, title };
  });
}
