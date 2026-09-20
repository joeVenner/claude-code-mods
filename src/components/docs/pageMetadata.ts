import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export interface PageMetadataInput {
  readonly title: string;
  readonly description: string;
  /** Site-relative path with trailing slash, for example `/security/`. */
  readonly path: string;
}

/**
 * Builds title, description, canonical and Open Graph together. The root layout sets an
 * `openGraph` block for `/`, and a page-level `openGraph` replaces it, so each page must
 * restate its own URL to avoid advertising the home page as its canonical share target.
 */
export function buildPageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, title, description, url: path, locale: "en_US" },
    twitter: { card: "summary", title, description },
  };
}
