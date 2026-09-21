import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { KIND_LABELS, type Extension } from "@/lib/types";
import { PAGE_SEO, type PageSeo } from "@/lib/seo/pages";
import {
  PREVIEW_IMAGE_CONTENT_TYPE,
  PREVIEW_IMAGE_SIZE,
  SITE_BANNER_ALT,
  buildEntryPreviewContent,
} from "@/lib/seo/previewContent";
import { clampText, indefiniteArticle, lowerCaseLabel, toSingleLine, withFinalPeriod } from "@/lib/seo/text";

/**
 * One typed place that builds `Metadata` for every page. Next replaces nested metadata objects
 * (`openGraph`, `twitter`, `alternates`) instead of merging them, so each page must restate all of
 * them. Routing every page through this module keeps that from drifting.
 */

/** Public GitHub handle and profile of the maintainer, shown as author and creator. */
export const SITE_AUTHOR = { name: "joeVenner", url: "https://github.com/joeVenner" } as const;

const SITE_CATEGORY = "technology";
export const ATOM_FEED_PATH = "/feed.xml";
export const ATOM_MEDIA_TYPE = "application/atom+xml";

/** Sentence that every description of a community listing must keep. */
export const COMMUNITY_DISCLOSURE = "Community listing, not published by Anthropic.";

export const MAX_TITLE_LENGTH = 60;
export const MIN_DESCRIPTION_LENGTH = 110;
export const MAX_DESCRIPTION_LENGTH = 160;
/** What the layout's title template appends to a page title. */
export const TITLE_TEMPLATE_SUFFIX = ` | ${SITE_NAME}`;
/** The `title.template` value set on the root layout. */
export const TITLE_TEMPLATE = `%s${TITLE_TEMPLATE_SUFFIX}`;
/** Search console tokens are short opaque strings; anything else is ignored rather than echoed into HTML. */
const VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

/** Absolute URL for a site-relative path, on `siteUrl` (the configured origin by default). */
export function absoluteUrl(path: string, siteUrl: string = SITE_URL): string {
  return `${siteUrl}${path}`;
}

export interface VerificationEnv {
  readonly google?: string | undefined;
  readonly bing?: string | undefined;
}

/**
 * Search console ownership tags from the environment. Unset or malformed values are omitted, so a
 * site without tokens ships no verification tags at all.
 */
export function resolveVerification(env: VerificationEnv): Metadata["verification"] | undefined {
  const google = isVerificationToken(env.google) ? env.google : undefined;
  const bing = isVerificationToken(env.bing) ? env.bing : undefined;
  if (google === undefined && bing === undefined) return undefined;
  return {
    ...(google === undefined ? {} : { google }),
    ...(bing === undefined ? {} : { other: { "msvalidate.01": bing } }),
  };
}

function isVerificationToken(value: string | undefined): value is string {
  return value !== undefined && VERIFICATION_TOKEN_PATTERN.test(value);
}

// Read the two variables by their literal names so Next can inline them.
const SITE_VERIFICATION = resolveVerification({
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
});

const SITE_IDENTITY: Metadata = {
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR.name, url: SITE_AUTHOR.url }],
  creator: SITE_AUTHOR.name,
  publisher: SITE_NAME,
  category: SITE_CATEGORY,
  // Verification tags are the same on every page, and Next only renders them where they are set.
  ...(SITE_VERIFICATION === undefined ? {} : { verification: SITE_VERIFICATION }),
};

const INDEXABLE_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

const NOINDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export interface PageMetadataOptions {
  readonly title: string;
  readonly description: string;
  /** Site-relative path with a trailing slash, for example `/security/`. */
  readonly path: string;
  /** True when the title already carries the site name, so the layout's title template is skipped. */
  readonly hasAbsoluteTitle?: boolean;
  /** False for pages that must stay out of search results, such as the 404 page. */
  readonly isIndexable?: boolean;
  /**
   * The page's own share image: the route folder holding its `opengraph-image` and `twitter-image`
   * files ("/extensions/some-slug", no trailing slash), and the alt text. Defaults to the site banner.
   */
  readonly previewImage?: PreviewImage;
}

export interface PreviewImage {
  readonly folder: string;
  readonly alt: string;
}

const SITE_PREVIEW_IMAGE: PreviewImage = { folder: "", alt: SITE_BANNER_ALT };

/**
 * Metadata for one page: title, description, absolute canonical, Open Graph, Twitter card, robots,
 * the Atom feed link and site-wide identity fields. Share images come from the `opengraph-image`
 * and `twitter-image` files next to the route, which Next attaches on its own.
 */
export function buildMetadata(options: PageMetadataOptions, siteUrl: string = SITE_URL): Metadata {
  const { title, description, path, hasAbsoluteTitle = false, isIndexable = true, previewImage = SITE_PREVIEW_IMAGE } = options;
  const canonical = absoluteUrl(path, siteUrl);
  const feedLink = { [ATOM_MEDIA_TYPE]: [{ url: absoluteUrl(ATOM_FEED_PATH, siteUrl), title: `${SITE_NAME} feed` }] };
  return {
    ...SITE_IDENTITY,
    title: hasAbsoluteTitle ? { absolute: title } : title,
    description,
    // A page kept out of search results has no canonical: the two signals would contradict each other.
    alternates: isIndexable ? { canonical, types: feedLink } : { types: feedLink },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title,
      description,
      ...(isIndexable ? { url: canonical } : {}),
      // A page's own openGraph object replaces the root layout's, and with it the root banner, so the
      // image is always named here. Naming it also gives each page its own alt text.
      images: [previewImageDescriptor(previewImage, "opengraph-image", siteUrl)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [previewImageDescriptor(previewImage, "twitter-image", siteUrl)],
    },
    robots: isIndexable ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS,
  };
}

function previewImageDescriptor(
  image: PreviewImage,
  file: "opengraph-image" | "twitter-image",
  siteUrl: string,
): { url: string; width: number; height: number; alt: string; type: string } {
  return {
    url: absoluteUrl(`${image.folder}/${file}`, siteUrl),
    width: PREVIEW_IMAGE_SIZE.width,
    height: PREVIEW_IMAGE_SIZE.height,
    alt: image.alt,
    type: PREVIEW_IMAGE_CONTENT_TYPE,
  };
}

/** Metadata for a static page described in `PAGE_SEO`. */
export function buildStaticPageMetadata(page: PageSeo): Metadata {
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    hasAbsoluteTitle: page.hasAbsoluteTitle,
    previewImage: page.previewImage,
  });
}

/** The 404 page: kept out of search results, with the same identity fields as every other page. */
export function buildNotFoundMetadata(): Metadata {
  return buildMetadata({
    title: "Page not found",
    description: "That address does not match a page or an extension in the Claude Code Mods directory. Browse the directory to find what you were after.",
    path: "/404/",
    isIndexable: false,
  });
}

/** Defaults set once in the root layout: `metadataBase`, the title template and site identity. */
export function buildRootMetadata(siteUrl: string = SITE_URL): Metadata {
  const home = PAGE_SEO.home;
  return {
    ...SITE_IDENTITY,
    metadataBase: new URL(siteUrl),
    title: { default: home.title, template: TITLE_TEMPLATE },
    description: SITE_DESCRIPTION,
    robots: INDEXABLE_ROBOTS,
    // Pages restate these through `buildMetadata`; the defaults cover any route that does not.
    openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", title: home.title, description: SITE_DESCRIPTION },
    twitter: { card: "summary_large_image", title: home.title, description: SITE_DESCRIPTION },
  };
}

/** Human readable kind, lower-cased for use inside a sentence ("mod", "MCP server"). */
function kindPhrase(extension: Pick<Extension, "kind">): string {
  return lowerCaseLabel(KIND_LABELS[extension.kind]);
}

/** True when `phrase` appears in `text` as whole words, so a name that merely contains the kind as a fragment does not count. */
function containsWholePhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "iu").test(text);
}

export interface ExtensionTitle {
  readonly title: string;
  /** True when the title omits the site name because adding it would pass 60 characters. */
  readonly hasAbsoluteTitle: boolean;
}

/**
 * "<name>, a <kind> for Claude Code", shortened in steps so the document title stays within 60
 * characters. The ` | Claude Code Mods` suffix is dropped before any of the words are.
 */
export function buildExtensionTitle(extension: Pick<Extension, "name" | "kind">): ExtensionTitle {
  const name = toSingleLine(extension.name);
  const kind = kindPhrase(extension);
  const article = indefiniteArticle(kind);
  const nameRepeatsKind = containsWholePhrase(name, kind);
  const candidates = [
    nameRepeatsKind ? `${name} for Claude Code` : `${name}, ${article} ${kind} for Claude Code`,
    nameRepeatsKind ? name : `${name}, ${article} ${kind}`,
    name,
  ];
  // Keep "for Claude Code" before keeping the site name: it is the phrase people search for.
  for (const candidate of candidates) {
    if ((candidate + TITLE_TEMPLATE_SUFFIX).length <= MAX_TITLE_LENGTH) return { title: candidate, hasAbsoluteTitle: false };
    if (candidate.length <= MAX_TITLE_LENGTH) return { title: candidate, hasAbsoluteTitle: true };
  }
  return { title: clampText(name, MAX_TITLE_LENGTH), hasAbsoluteTitle: true };
}

/** What the browser tab reads: the layout's template applied to a plain title, an absolute title as written. */
export function resolveDocumentTitle(title: NonNullable<Metadata["title"]>): string {
  if (typeof title === "string") return `${title}${TITLE_TEMPLATE_SUFFIX}`;
  if ("absolute" in title && typeof title.absolute === "string") return title.absolute;
  if ("default" in title) return title.default;
  throw new Error("title has no absolute or default value");
}

/**
 * The publisher sentence for an entry. A community listing is never described as published by
 * Anthropic, and a community publisher name that claims to be Anthropic is not repeated at all.
 */
export function describePublisher(publisher: Extension["publisher"]): string {
  const name = toSingleLine(publisher.name);
  if (publisher.kind !== "community") return `Published by ${name}.`;
  const claimsAnthropic = /anthropic/i.test(name);
  return claimsAnthropic ? COMMUNITY_DISCLOSURE : `Published by ${name}. ${COMMUNITY_DISCLOSURE}`;
}

/**
 * The entry's own summary plus its publisher, kept between 110 and 160 characters where the data
 * allows. A summary already near the limit drops the publisher sentence rather than being cut.
 * For a community listing the disclosure sentence always survives: the summary is shortened
 * first, so a long submitted summary can never push "not published by Anthropic" out of the text.
 */
export function buildExtensionDescription(extension: Pick<Extension, "summary" | "publisher">): string {
  const summary = withFinalPeriod(toSingleLine(extension.summary));
  const publisher = describePublisher(extension.publisher);
  const directoryNote = `Listed in the ${SITE_NAME} directory.`;
  const isCommunity = extension.publisher.kind === "community";
  const attempts = isCommunity
    ? [`${summary} ${publisher} ${directoryNote}`, `${summary} ${publisher}`, `${summary} ${COMMUNITY_DISCLOSURE}`]
    : [`${summary} ${publisher} ${directoryNote}`, `${summary} ${publisher}`, `${summary} ${directoryNote}`, summary];
  const fitting = attempts.filter((text) => text.length <= MAX_DESCRIPTION_LENGTH);
  // Prefer the richest text that fits.
  if (fitting.length > 0) return fitting.find((text) => text.length >= MIN_DESCRIPTION_LENGTH) ?? fitting[0];
  if (!isCommunity) return clampText(summary, MAX_DESCRIPTION_LENGTH);
  const room = MAX_DESCRIPTION_LENGTH - COMMUNITY_DISCLOSURE.length - 1;
  const shortened = clampText(summary, room);
  return shortened === "" ? COMMUNITY_DISCLOSURE : `${shortened} ${COMMUNITY_DISCLOSURE}`;
}

/** Metadata for `/extensions/<slug>/`, derived only from the entry. */
export function buildExtensionMetadata(extension: Extension, siteUrl: string = SITE_URL): Metadata {
  const { title, hasAbsoluteTitle } = buildExtensionTitle(extension);
  return buildMetadata(
    {
      title,
      hasAbsoluteTitle,
      description: buildExtensionDescription(extension),
      path: extensionPath(extension.slug),
      previewImage: { folder: extensionPath(extension.slug).replace(/\/$/, ""), alt: buildEntryPreviewContent(extension).alt },
    },
    siteUrl,
  );
}

export function extensionPath(slug: string): string {
  return `/extensions/${slug}/`;
}
