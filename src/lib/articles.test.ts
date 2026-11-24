import { describe, expect, it } from "vitest";
import { ARTICLES } from "@/components/docs/articlesContent";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import {
  ARTICLE_DESCRIPTION_LENGTH,
  ARTICLE_TITLE_MAX_LENGTH,
  articlePath,
  articleProblems,
  articleTexts,
  findArticle,
  formatArticleDate,
  parseInline,
  sortArticlesByNewest,
  type Article,
} from "./articles";

const baseArticle: Article = {
  slug: "sample-article",
  title: "A sample article title",
  description: "A description long enough to pass the length rule: it says what the article covers and why a reader would open it today.",
  headline: "A sample article",
  publishedAt: "2026-11-01",
  updatedAt: "2026-11-02",
  checkedAgainstVersion: "2.1.300",
  relatedSlugs: [],
  sections: [
    {
      id: "intro",
      title: "Intro",
      blocks: [{ kind: "paragraph", text: "Plain text." }],
      sources: [{ label: "Docs", href: "https://code.claude.com/docs/en/hooks" }],
    },
  ],
};

describe("parseInline", () => {
  it("returns one text part for plain text", () => {
    expect(parseInline("Just words.")).toEqual([{ kind: "text", text: "Just words." }]);
  });

  it("splits code and links out of the surrounding text, in order", () => {
    expect(parseInline("Run `claude update`, then read [the docs](https://code.claude.com/docs/en/code-mode).")).toEqual([
      { kind: "text", text: "Run " },
      { kind: "code", code: "claude update" },
      { kind: "text", text: ", then read " },
      { kind: "link", label: "the docs", href: "https://code.claude.com/docs/en/code-mode" },
      { kind: "text", text: "." },
    ]);
  });

  it("keeps an unmatched backtick or bracket as literal text", () => {
    expect(parseInline("a ` b [c] (d)")).toEqual([{ kind: "text", text: "a ` b [c] (d)" }]);
  });

  it("returns no parts for an empty string", () => {
    expect(parseInline("")).toEqual([]);
  });

  it("returns a javascript: href as written, for the article rules and TextLink to reject", () => {
    expect(parseInline("[x](javascript:alert(1)")).toEqual([{ kind: "link", label: "x", href: "javascript:alert(1" }]);
  });
});

describe("article helpers", () => {
  it("builds the path with a trailing slash", () => {
    expect(articlePath("code-mode")).toBe("/learn/articles/code-mode/");
  });

  it("sorts newest first, then by title", () => {
    const older = { ...baseArticle, slug: "older", title: "B", publishedAt: "2026-10-01" };
    const newerB = { ...baseArticle, slug: "newer-b", title: "B", publishedAt: "2026-11-01" };
    const newerA = { ...baseArticle, slug: "newer-a", title: "A", publishedAt: "2026-11-01" };
    expect(sortArticlesByNewest([older, newerB, newerA]).map((article) => article.slug)).toEqual(["newer-a", "newer-b", "older"]);
  });

  it("finds an article by slug, and returns undefined for an unknown one", () => {
    expect(findArticle([baseArticle], "sample-article")).toBe(baseArticle);
    expect(findArticle([baseArticle], "missing")).toBeUndefined();
  });

  it("formats dates in UTC as a long US date", () => {
    expect(formatArticleDate("2026-11-20")).toBe("November 20, 2026");
    expect(formatArticleDate("2026-01-01")).toBe("January 1, 2026");
  });
});

describe("articleProblems", () => {
  it("accepts a valid article", () => {
    expect(articleProblems([baseArticle])).toEqual([]);
  });

  it.each<[string, Partial<Article>, RegExp]>([
    ["a bad slug", { slug: "Bad Slug" }, /slug must be/],
    ["a long title", { title: "x".repeat(ARTICLE_TITLE_MAX_LENGTH + 1) }, /title is 42 characters/],
    ["a short description", { description: "Too short." }, /description is 10 characters/],
    ["a bad date", { publishedAt: "2026-13-45" }, /publishedAt is not a YYYY-MM-DD date/],
    ["an update before the publish date", { updatedAt: "2026-10-01" }, /updatedAt is before publishedAt/],
    ["no sections", { sections: [] }, /has no sections/],
    ["a dangling related slug", { relatedSlugs: ["nope"] }, /related slug "nope" is not an article/],
    ["itself as related", { relatedSlugs: ["sample-article"] }, /lists itself as related/],
  ])("reports %s", (_name, change, message) => {
    expect(articleProblems([{ ...baseArticle, ...change }]).join("\n")).toMatch(message);
  });

  it("reports a slug used twice", () => {
    expect(articleProblems([baseArticle, baseArticle]).join("\n")).toMatch(/slug is used twice/);
  });

  it("reports a section with no source, a repeated section id and an unsafe inline link", () => {
    const [section] = baseArticle.sections;
    const broken: Article = {
      ...baseArticle,
      sections: [
        { ...section, sources: [] },
        { ...section, blocks: [{ kind: "paragraph", text: "See [this](javascript:alert(1))." }] },
      ],
    };
    const problems = articleProblems([broken]).join("\n");
    expect(problems).toMatch(/section "intro" names no source/);
    expect(problems).toMatch(/section id "intro" is used twice/);
    expect(problems).toMatch(/unsafe link/);
  });
});

describe("published articles", () => {
  it("follow every article rule", () => {
    expect(articleProblems(ARTICLES)).toEqual([]);
  });

  it("keep titles and descriptions inside the search snippet limits", () => {
    for (const article of ARTICLES) {
      expect(article.title.length, article.slug).toBeLessThanOrEqual(ARTICLE_TITLE_MAX_LENGTH);
      expect(article.description.length, article.slug).toBeGreaterThanOrEqual(ARTICLE_DESCRIPTION_LENGTH.min);
      expect(article.description.length, article.slug).toBeLessThanOrEqual(ARTICLE_DESCRIPTION_LENGTH.max);
    }
  });

  it("use no en or em dashes anywhere", () => {
    for (const article of ARTICLES) {
      for (const text of articleTexts(article)) expect(text, article.slug).not.toMatch(DASH_PATTERN);
    }
  });

  it("cite only Anthropic's own docs as sources", () => {
    for (const article of ARTICLES) {
      for (const section of article.sections) {
        for (const source of section.sources) expect(source.href, `${article.slug}#${section.id}`).toMatch(/^https:\/\/code\.claude\.com\/docs\/en\//);
      }
    }
  });

  it("are not dated in the future (UTC)", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const article of ARTICLES) expect(article.updatedAt <= today, article.slug).toBe(true);
  });

  it("leave no unparsed link or code syntax in their text", () => {
    for (const article of ARTICLES) {
      for (const part of articleTexts(article).flatMap((text) => parseInline(text))) {
        if (part.kind !== "text") continue;
        expect(part.text, article.slug).not.toMatch(/\]\(|`/);
      }
    }
  });

  it("use no star-style Markdown emphasis in prose, which RichText would show as literal stars", () => {
    for (const article of ARTICLES) {
      for (const section of article.sections) {
        for (const block of section.blocks) {
          if (block.kind === "code") continue;
          const texts = block.kind === "list" ? block.items : [block.text];
          for (const part of texts.flatMap((text) => parseInline(text))) {
            const prose = part.kind === "text" ? part.text : part.kind === "link" ? part.label : "";
            expect(prose, `${article.slug}#${section.id}`).not.toMatch(/\*\S|\S\*/);
          }
        }
      }
    }
  });

  it("link inline only to other articles or https pages", () => {
    const slugs = new Set(ARTICLES.map((article) => article.slug));
    for (const article of ARTICLES) {
      for (const part of articleTexts(article).flatMap((text) => parseInline(text))) {
        if (part.kind !== "link") continue;
        if (part.href.startsWith("/")) {
          const match = /^\/learn\/articles\/([a-z0-9-]+)\/$/.exec(part.href);
          expect(match?.[1] !== undefined && slugs.has(match[1]), `${article.slug}: ${part.href}`).toBe(true);
        } else {
          expect(part.href.startsWith("https://"), `${article.slug}: ${part.href}`).toBe(true);
        }
      }
    }
  });
});
