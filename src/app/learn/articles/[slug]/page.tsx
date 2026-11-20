import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArticleBody } from "@/components/docs/ArticleBody";
import { ARTICLES } from "@/components/docs/articlesContent";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { TextLink } from "@/components/docs/TextLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { ARTICLES_PATH, articlePath, findArticle, formatArticleDate, type Article } from "@/lib/articles";
import { buildArticleGraph } from "@/lib/seo/jsonLd";
import { buildMetadata } from "@/lib/seo/metadata";

// Static export: only the slugs in ARTICLES exist, anything else is a 404.
export const dynamicParams = false;

interface ArticlePageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = findArticle(ARTICLES, slug);
  if (article === undefined) return {};
  return buildMetadata({ title: article.title, description: article.description, path: articlePath(article.slug) });
}

function ArticleDates({ article }: { readonly article: Article }): ReactNode {
  const isUpdated = article.updatedAt !== article.publishedAt;
  return (
    <p className="max-w-[65ch] text-sm text-fg-muted">
      Published <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
      {isUpdated ? (
        <>
          {", updated "}
          <time dateTime={article.updatedAt}>{formatArticleDate(article.updatedAt)}</time>
        </>
      ) : null}
      {`. Checked against Claude Code v${article.checkedAgainstVersion}. This site is unofficial; the sources under each section are Anthropic's own pages.`}
    </p>
  );
}

function RelatedArticles({ slugs }: { readonly slugs: readonly string[] }): ReactNode {
  const related = slugs.flatMap((slug) => {
    const article = findArticle(ARTICLES, slug);
    return article === undefined ? [] : [article];
  });
  return (
    <DocSection id="related" title="Related articles">
      <Prose>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          {related.map((article) => (
            <li key={article.slug}>
              <TextLink href={articlePath(article.slug)}>{article.headline}</TextLink>
            </li>
          ))}
          <li>
            <TextLink href={ARTICLES_PATH}>All articles</TextLink>
          </li>
        </ul>
      </Prose>
    </DocSection>
  );
}

export default async function ArticlePage({ params }: ArticlePageProps): Promise<ReactNode> {
  const { slug } = await params;
  const article = findArticle(ARTICLES, slug);
  if (article === undefined) notFound();
  return (
    <DocPage title={article.headline} description={article.description}>
      <JsonLd data={buildArticleGraph(article)} />
      <ArticleDates article={article} />
      <ArticleBody sections={article.sections} />
      <RelatedArticles slugs={article.relatedSlugs} />
    </DocPage>
  );
}
