import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { ARTICLES } from "@/components/docs/articlesContent";
import { DASH_PATTERN, linkHref, stubIntersectionObserver } from "@/components/docs/testSupport";
import { articlePath, sortArticlesByNewest } from "@/lib/articles";
import { PAGE_SEO } from "@/lib/seo/pages";
import { SITE_URL } from "@/lib/site";
import ArticlesPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("articles index page", () => {
  it("has one h1, an h2 per article and no en or em dashes", () => {
    const { container } = render(<ArticlesPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(ARTICLES.length);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
  });

  it("lists every article newest first, linked to its own page with its date", () => {
    render(<ArticlesPage />);
    const items = within(screen.getByRole("list", { name: "Articles, newest first" })).getAllByRole("listitem");
    const expected = sortArticlesByNewest(ARTICLES);
    expect(items).toHaveLength(expected.length);
    items.forEach((item, index) => {
      const article = expected[index];
      expect(within(item).getByRole("link", { name: article.headline })).toHaveAttribute("href", linkHref(articlePath(article.slug)));
      expect(item.querySelector("time")).toHaveAttribute("datetime", article.publishedAt);
      expect(item).toHaveTextContent(article.description);
    });
  });

  it("uses the PAGE_SEO title, description and canonical URL", () => {
    expect(metadata.title).toBe(PAGE_SEO.learnArticles.title);
    expect(metadata.description).toBe(PAGE_SEO.learnArticles.description);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/learn/articles/`);
  });
});
