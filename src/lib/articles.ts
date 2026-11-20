import { classifyHref } from "@/lib/url";

/**
 * Articles: dated write-ups about recent Claude Code releases, served under `/learn/articles/`.
 * The content lives in `src/components/docs/articlesContent.ts`, next to the other doc content;
 * this module holds the types, the inline text parser and the pure helpers the pages, the
 * sitemap, the feed and the llms files share, so no list of articles is written twice.
 */

export const ARTICLES_PATH = "/learn/articles/";

/** Lower-case words joined by single hyphens: the slug is the article's URL segment. */
export const ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Same limits as `PAGE_SEO`, so `<title> | Claude Code Mods` fits in 60 and a snippet is not cut. */
export const ARTICLE_TITLE_MAX_LENGTH = 41;
export const ARTICLE_DESCRIPTION_LENGTH = { min: 110, max: 160 } as const;

export interface ArticleSource {
  readonly label: string;
  readonly href: string;
}

/**
 * Text in a paragraph, list item or callout is one string with two inline forms:
 * `` `code` `` and `[label](href)`. Everything else is literal text, rendered as text and never as markup.
 */
export type ArticleText = string;

export type ArticleBlock =
  | { readonly kind: "paragraph"; readonly text: ArticleText }
  | { readonly kind: "list"; readonly items: readonly ArticleText[] }
  | { readonly kind: "code"; readonly code: string; readonly filename?: string; readonly label?: string }
  | { readonly kind: "callout"; readonly tone: "note" | "warning"; readonly text: ArticleText };

export interface ArticleSection {
  /** Anchor id, unique within the article. */
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly ArticleBlock[];
  /** Where the section's claims come from. Every section names at least one source. */
  readonly sources: readonly ArticleSource[];
}

export interface Article {
  readonly slug: string;
  /** `<title>` and card title, at most 41 characters. */
  readonly title: string;
  /** Meta description and card text, 110 to 160 characters. */
  readonly description: string;
  /** Visible h1, free to be longer than the title. */
  readonly headline: string;
  /** YYYY-MM-DD. */
  readonly publishedAt: string;
  /** YYYY-MM-DD, never before `publishedAt`. */
  readonly updatedAt: string;
  /** The Claude Code release the article was last checked against, for example `2.1.329`. */
  readonly checkedAgainstVersion: string;
  readonly sections: readonly ArticleSection[];
  /** Slugs of other articles to link at the end. */
  readonly relatedSlugs: readonly string[];
}

export type InlinePart =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "code"; readonly code: string }
  | { readonly kind: "link"; readonly label: string; readonly href: string };

// One alternation, tried left to right at each position: a backtick span, or a Markdown-style link.
const INLINE_PATTERN = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Splits article text into text, code and link parts. An unmatched backtick or bracket stays
 * literal text, so a typo shows up on the page instead of swallowing the rest of the paragraph.
 * Hrefs are returned as written; the renderer's `TextLink` rejects unsafe ones.
 */
export function parseInline(text: ArticleText): readonly InlinePart[] {
  const parts: InlinePart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const start = match.index;
    if (start > cursor) parts.push({ kind: "text", text: text.slice(cursor, start) });
    const [whole, code, label, href] = match;
    parts.push(code !== undefined ? { kind: "code", code } : { kind: "link", label, href });
    cursor = start + whole.length;
  }
  if (cursor < text.length) parts.push({ kind: "text", text: text.slice(cursor) });
  return parts;
}

/** Site-relative path of one article, with the trailing slash the static export uses. */
export function articlePath(slug: string): string {
  return `${ARTICLES_PATH}${slug}/`;
}

/** Newest first by publish date, then title, so the order is stable when two share a date. */
export function sortArticlesByNewest(articles: readonly Article[]): readonly Article[] {
  return [...articles].sort((left, right) => {
    const byDate = right.publishedAt.localeCompare(left.publishedAt);
    return byDate !== 0 ? byDate : left.title.localeCompare(right.title);
  });
}

const LONG_DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

/** `2026-11-20` as `November 20, 2026`, read in UTC so the build machine's time zone can't shift the day. */
export function formatArticleDate(isoDate: string): string {
  return LONG_DATE.format(new Date(`${isoDate}T00:00:00Z`));
}

export function findArticle(articles: readonly Article[], slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

/** Every text string an article renders, for copy checks such as the no-long-dash rule. */
export function articleTexts(article: Article): readonly string[] {
  const blockTexts = (block: ArticleBlock): readonly string[] => {
    switch (block.kind) {
      case "paragraph":
      case "callout":
        return [block.text];
      case "list":
        return block.items;
      case "code":
        return [block.code, block.filename ?? "", block.label ?? ""];
    }
  };
  return [
    article.title,
    article.description,
    article.headline,
    ...article.sections.flatMap((section) => [
      section.title,
      ...section.sources.map((source) => source.label),
      ...section.blocks.flatMap(blockTexts),
    ]),
  ];
}

function isRealDate(value: string): boolean {
  return ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** Links an article renders: inline links in its text and every section source. */
function articleHrefs(article: Article): readonly string[] {
  const inlineHrefs = articleTexts(article)
    .flatMap((text) => parseInline(text))
    .flatMap((part) => (part.kind === "link" ? [part.href] : []));
  const sourceHrefs = article.sections.flatMap((section) => section.sources.map((source) => source.href));
  return [...inlineHrefs, ...sourceHrefs];
}

/**
 * Problems with the article list, one string each; empty when every rule holds. Run by the tests,
 * so a bad slug, an over-long title, a dangling related slug or an unsafe link fails CI, not readers.
 */
export function articleProblems(articles: readonly Article[]): readonly string[] {
  const problems: string[] = [];
  const slugs = new Set<string>();
  for (const article of articles) {
    const where = article.slug;
    if (!ARTICLE_SLUG_PATTERN.test(article.slug)) problems.push(`${where}: slug must be lower-case words joined by hyphens`);
    if (slugs.has(article.slug)) problems.push(`${where}: slug is used twice`);
    slugs.add(article.slug);
    if (article.title.length > ARTICLE_TITLE_MAX_LENGTH) {
      problems.push(`${where}: title is ${article.title.length} characters, the limit is ${ARTICLE_TITLE_MAX_LENGTH}`);
    }
    const { min, max } = ARTICLE_DESCRIPTION_LENGTH;
    if (article.description.length < min || article.description.length > max) {
      problems.push(`${where}: description is ${article.description.length} characters, it must be ${min} to ${max}`);
    }
    if (!isRealDate(article.publishedAt)) problems.push(`${where}: publishedAt is not a YYYY-MM-DD date`);
    if (!isRealDate(article.updatedAt)) problems.push(`${where}: updatedAt is not a YYYY-MM-DD date`);
    if (article.updatedAt < article.publishedAt) problems.push(`${where}: updatedAt is before publishedAt`);
    if (article.sections.length === 0) problems.push(`${where}: has no sections`);
    const sectionIds = new Set<string>();
    for (const section of article.sections) {
      if (!ARTICLE_SLUG_PATTERN.test(section.id)) problems.push(`${where}: section id "${section.id}" is not a valid anchor`);
      if (sectionIds.has(section.id)) problems.push(`${where}: section id "${section.id}" is used twice`);
      sectionIds.add(section.id);
      if (section.sources.length === 0) problems.push(`${where}: section "${section.id}" names no source`);
    }
    for (const href of articleHrefs(article)) {
      if (classifyHref(href) === "unsafe") problems.push(`${where}: unsafe link ${JSON.stringify(href)}`);
    }
  }
  for (const article of articles) {
    for (const related of article.relatedSlugs) {
      if (related === article.slug) problems.push(`${article.slug}: lists itself as related`);
      else if (!slugs.has(related)) problems.push(`${article.slug}: related slug "${related}" is not an article`);
    }
  }
  return problems;
}
