import { articlePath, type Article } from "@/lib/articles";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { KIND_LABELS, type Extension } from "@/lib/types";
import { ATOM_FEED_PATH, SITE_AUTHOR, absoluteUrl as rawAbsoluteUrl, buildExtensionDescription, extensionPath } from "@/lib/seo/metadata";
import { toSingleLine } from "@/lib/seo/text";
import { toSafeOutputUrl } from "@/lib/url";

/**
 * Atom feed of the directory, newest first. Extension entries carry only what the catalog states:
 * a title, a summary, a link and the date the source URL last responded. Article entries carry the
 * article's title, description, link and last update date.
 */

/** A feed reader wants what is new, not the whole directory, and the file must stay small as the catalog grows. */
export const FEED_MAX_ENTRIES = 50;

export interface FeedInput {
  readonly extensions: readonly Extension[];
  /** Articles to list beside the extensions; none when left out. */
  readonly articles?: readonly Article[];
  /** Catalog date (YYYY-MM-DD). Only the feed's `updated` time when there are no entries to take it from. */
  readonly generatedAt: string;
  readonly siteUrl?: string;
}

function absoluteUrl(path: string, siteUrl: string): string {
  return toSafeOutputUrl(rawAbsoluteUrl(path, siteUrl));
}

const XML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/** Escapes text for XML content and attribute values. */
export function escapeXml(value: string): string {
  return toSingleLine(value).replace(/[&<>"']/g, (character) => XML_ESCAPES[character]);
}

/** Newest check first, then name, so the order is deterministic when many entries share a date. */
export function sortByNewestCheck(extensions: readonly Extension[]): readonly Extension[] {
  return [...extensions].sort((left, right) => {
    const byDate = right.verification.checkedAt.localeCompare(left.verification.checkedAt);
    return byDate !== 0 ? byDate : left.name.localeCompare(right.name);
  });
}

function toAtomTime(isoDate: string): string {
  return `${isoDate}T00:00:00Z`;
}

function entryXml(extension: Extension, siteUrl: string): string {
  const url = escapeXml(absoluteUrl(extensionPath(extension.slug), siteUrl));
  return [
    "  <entry>",
    `    <id>${url}</id>`,
    `    <title>${escapeXml(extension.name)}</title>`,
    `    <link rel="alternate" type="text/html" href="${url}"/>`,
    `    <updated>${toAtomTime(extension.verification.checkedAt)}</updated>`,
    `    <category term="${escapeXml(extension.kind)}" label="${escapeXml(KIND_LABELS[extension.kind])}"/>`,
    `    <summary type="text">${escapeXml(buildExtensionDescription(extension))}</summary>`,
    "  </entry>",
  ].join("\n");
}

function articleEntryXml(article: Article, siteUrl: string): string {
  const url = escapeXml(absoluteUrl(articlePath(article.slug), siteUrl));
  return [
    "  <entry>",
    `    <id>${url}</id>`,
    `    <title>${escapeXml(article.title)}</title>`,
    `    <link rel="alternate" type="text/html" href="${url}"/>`,
    `    <published>${toAtomTime(article.publishedAt)}</published>`,
    `    <updated>${toAtomTime(article.updatedAt)}</updated>`,
    `    <category term="article" label="Article"/>`,
    `    <summary type="text">${escapeXml(article.description)}</summary>`,
    "  </entry>",
  ].join("\n");
}

interface FeedItem {
  /** YYYY-MM-DD the entry is sorted by and shows as `updated`. */
  readonly date: string;
  readonly title: string;
  readonly xml: string;
}

/** Extensions and articles as one list, newest first, then by title, capped at `FEED_MAX_ENTRIES`. */
function newestItems(input: FeedInput, siteUrl: string): readonly FeedItem[] {
  const extensionItems = sortByNewestCheck(input.extensions).map((extension) => ({
    date: extension.verification.checkedAt,
    title: extension.name,
    xml: entryXml(extension, siteUrl),
  }));
  const articleItems = (input.articles ?? []).map((article) => ({
    date: article.updatedAt,
    title: article.title,
    xml: articleEntryXml(article, siteUrl),
  }));
  return [...extensionItems, ...articleItems]
    .sort((left, right) => {
      const byDate = right.date.localeCompare(left.date);
      return byDate !== 0 ? byDate : left.title.localeCompare(right.title);
    })
    .slice(0, FEED_MAX_ENTRIES);
}

/** The feed document as an XML string. */
export function buildAtomFeed(input: FeedInput): string {
  const siteUrl = input.siteUrl ?? SITE_URL;
  const home = escapeXml(absoluteUrl("/", siteUrl));
  const feedUrl = escapeXml(absoluteUrl(ATOM_FEED_PATH, siteUrl));
  const newest = newestItems(input, siteUrl);
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <id>${home}</id>`,
    `  <title>${escapeXml(SITE_NAME)}</title>`,
    `  <subtitle>${escapeXml(SITE_DESCRIPTION)}</subtitle>`,
    `  <link rel="self" type="application/atom+xml" href="${feedUrl}"/>`,
    `  <link rel="alternate" type="text/html" href="${home}"/>`,
    // The newest entry date, so a reader sees the feed change only when an entry did.
    `  <updated>${toAtomTime(newest[0]?.date ?? input.generatedAt)}</updated>`,
    "  <author>",
    `    <name>${escapeXml(SITE_AUTHOR.name)}</name>`,
    `    <uri>${escapeXml(toSafeOutputUrl(SITE_AUTHOR.url))}</uri>`,
    "  </author>",
    ...newest.map((item) => item.xml),
    "</feed>",
    "",
  ].join("\n");
}
