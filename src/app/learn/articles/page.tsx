import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ARTICLES } from "@/components/docs/articlesContent";
import { Callout } from "@/components/docs/Callout";
import { DocPage } from "@/components/docs/DocPage";
import { TextLink } from "@/components/docs/TextLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { articlePath, formatArticleDate, sortArticlesByNewest } from "@/lib/articles";
import { buildDocPageGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.learnArticles);

export default function ArticlesPage(): ReactNode {
  const articles = sortArticlesByNewest(ARTICLES);
  return (
    <DocPage
      title="Claude Code articles"
      description="Write-ups of recent Claude Code releases, newest first. Each one restates Anthropic's docs and changelog, links its sources and names the version it was checked against."
    >
      <JsonLd data={buildDocPageGraph(PAGE_SEO.learnArticles)} />
      <Callout>
        <p>
          This site is unofficial. Features marked experimental can change or disappear in any release, so check the linked docs
          before you rely on a detail.
        </p>
      </Callout>
      <ol className="flex max-w-3xl flex-col gap-6" aria-label="Articles, newest first">
        {articles.map((article) => (
          <li key={article.slug} className="flex flex-col gap-2 rounded-panel border border-border bg-surface p-5 md:p-6">
            <h2 className="text-xl font-semibold leading-snug tracking-tight text-fg text-balance">
              <TextLink href={articlePath(article.slug)}>{article.headline}</TextLink>
            </h2>
            <p className="text-sm text-fg-muted">
              <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
              {` · checked against Claude Code v${article.checkedAgainstVersion}`}
            </p>
            <p className="max-w-[65ch] text-base leading-relaxed text-fg-muted">{article.description}</p>
          </li>
        ))}
      </ol>
    </DocPage>
  );
}
