import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { ARTICLES } from "@/components/docs/articlesContent";
import { DASH_PATTERN, linkHref, stubIntersectionObserver } from "@/components/docs/testSupport";
import { articlePath, findArticle } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";
import ArticlePage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

beforeAll(stubIntersectionObserver);

function paramsFor(slug: string): Promise<{ slug: string }> {
  return Promise.resolve({ slug });
}

describe("article route", () => {
  it("generates one static param per article", () => {
    expect(generateStaticParams().map((param) => param.slug)).toEqual(ARTICLES.map((article) => article.slug));
  });

  it("returns 404 for slugs outside the list on the static export", () => {
    expect(dynamicParams).toBe(false);
  });

  it("builds metadata from the article title, description and canonical path", async () => {
    const [article] = ARTICLES;
    const metadata = await generateMetadata({ params: paramsFor(article.slug) });
    expect(metadata.title).toBe(article.title);
    expect(metadata.description).toBe(article.description);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${articlePath(article.slug)}`);
  });

  it("returns empty metadata for an unknown slug", async () => {
    expect(await generateMetadata({ params: paramsFor("no-such-article") })).toEqual({});
  });

  it("throws the not-found signal for an unknown slug", async () => {
    await expect(ArticlePage({ params: paramsFor("no-such-article") })).rejects.toThrow();
  });

  it.each(ARTICLES.map((article) => [article.slug] as const))("renders %s in full", async (slug) => {
    const article = findArticle(ARTICLES, slug);
    if (article === undefined) throw new Error(`missing ${slug}`);
    const { container } = render(await ArticlePage({ params: paramsFor(slug) }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(article.headline);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
    expect(container.querySelector(`time[datetime="${article.publishedAt}"]`)).not.toBeNull();
    expect(container.textContent).toContain(`Claude Code v${article.checkedAgainstVersion}`);

    for (const section of article.sections) {
      const region = screen.getByRole("region", { name: section.title });
      expect(region).toHaveAttribute("id", section.id);
      for (const source of section.sources) {
        expect(within(region).getAllByRole("link", { name: new RegExp(source.label) })[0]).toHaveAttribute("href", source.href);
      }
    }

    const related = screen.getByRole("region", { name: "Related articles" });
    for (const relatedSlug of article.relatedSlugs) {
      expect(within(related).getByRole("link", { name: findArticle(ARTICLES, relatedSlug)?.headline })).toHaveAttribute("href", linkHref(articlePath(relatedSlug)));
    }
    expect(within(related).getByRole("link", { name: "All articles" })).toHaveAttribute("href", linkHref("/learn/articles/"));
  });

  it("renders inline code as code, and never as markup", async () => {
    const { container } = render(await ArticlePage({ params: paramsFor("code-mode") }));
    const codes = [...container.querySelectorAll("p code")].map((node) => node.textContent);
    expect(codes).toContain("CLAUDE_CODE_EXPERIMENTAL_CODE_MODE");
    expect(container.innerHTML).not.toContain("`CLAUDE_CODE_EXPERIMENTAL_CODE_MODE`");
  });

  it("embeds TechArticle JSON-LD with the real dates", async () => {
    const [article] = ARTICLES;
    const { container } = render(await ArticlePage({ params: paramsFor(article.slug) }));
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.textContent ?? "{}") as { "@graph": { "@type": string; datePublished?: string }[] };
    const node = data["@graph"].find((entry) => entry["@type"] === "TechArticle");
    expect(node?.datePublished).toBe(article.publishedAt);
  });
});
