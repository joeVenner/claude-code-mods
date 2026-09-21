import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import { builtInModExtension, sourceOnlyExtension, verifiedExtension } from "@/components/catalog/__fixtures__/extensions";
import { getAllExtensions } from "@/lib/catalog";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Extension } from "@/lib/types";
import {
  ATOM_FEED_PATH,
  ATOM_MEDIA_TYPE,
  COMMUNITY_DISCLOSURE,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  SITE_AUTHOR,
  TITLE_TEMPLATE,
  TITLE_TEMPLATE_SUFFIX,
  type ExtensionTitle,
  buildExtensionDescription,
  buildExtensionMetadata,
  buildExtensionTitle,
  buildMetadata,
  buildNotFoundMetadata,
  buildRootMetadata,
  buildStaticPageMetadata,
  describePublisher,
  resolveDocumentTitle,
  resolveVerification,
} from "./metadata";
import { PAGE_SEO, STATIC_PAGE_KEYS } from "./pages";
import { SITE_BANNER_ALT, buildEntryPreviewContent } from "./previewContent";

const SPACED_HYPHEN = / - /;
/** "published by Anthropic" unless it is the negation "not published by Anthropic". */
const NOT_NEGATED_ANTHROPIC = /(?<!not )published by anthropic/i;

function documentTitleOf(metadata: Metadata): string {
  if (metadata.title === undefined || metadata.title === null) throw new Error("metadata has no title");
  return resolveDocumentTitle(metadata.title);
}

/** The tab title for an `ExtensionTitle`, using the same rule the pages use. */
function tabTitleOf({ title, hasAbsoluteTitle }: ExtensionTitle): string {
  return resolveDocumentTitle(hasAbsoluteTitle ? { absolute: title } : title);
}

function textOf(metadata: Metadata): string {
  return [documentTitleOf(metadata), String(metadata.description)].join("\n");
}

describe("static page metadata", () => {
  const entries = STATIC_PAGE_KEYS.map((key) => ({ key, page: PAGE_SEO[key], metadata: buildStaticPageMetadata(PAGE_SEO[key]) }));

  it.each(entries)("$key: title fits the limit with the site template", ({ metadata }) => {
    expect(documentTitleOf(metadata).length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });

  it.each(entries)("$key: description is 110 to 160 characters", ({ page }) => {
    expect(page.description.length).toBeGreaterThanOrEqual(MIN_DESCRIPTION_LENGTH);
    expect(page.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
  });

  it.each(entries)("$key: text contains no long dashes or spaced hyphens", ({ metadata }) => {
    expect(DASH_PATTERN.test(textOf(metadata))).toBe(false);
    expect(SPACED_HYPHEN.test(textOf(metadata))).toBe(false);
  });

  it.each(entries)("$key: canonical is absolute and ends with a slash", ({ page, metadata }) => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${page.path}`);
    expect(String(metadata.alternates?.canonical)).toMatch(/^https?:\/\/.+\/$/);
  });

  it.each(entries)("$key: Open Graph, Twitter, robots and identity are complete", ({ page, metadata }) => {
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: `${SITE_URL}${page.path}`,
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
      googleBot: { "max-image-preview": "large", "max-snippet": -1 },
    });
    expect(metadata.applicationName).toBe(SITE_NAME);
    expect(metadata.authors).toEqual([{ name: "joeVenner", url: "https://github.com/joeVenner" }]);
    expect(SITE_AUTHOR.url).toBe("https://github.com/joeVenner");
    expect(metadata.creator).toBe("joeVenner");
    expect(metadata.category).toBeTruthy();
  });

  it.each(entries)("$key: links the Atom feed", ({ metadata }) => {
    expect(metadata.alternates?.types?.[ATOM_MEDIA_TYPE]).toEqual([
      { url: `${SITE_URL}${ATOM_FEED_PATH}`, title: `${SITE_NAME} feed` },
    ]);
  });

  it("words the home description as a link check, not a claim about the code", () => {
    expect(PAGE_SEO.home.description).toContain("whose URL responded when last checked");
    expect(PAGE_SEO.home.description).not.toContain("that was checked");
  });

  it("never claims that entries were reviewed, scanned, audited or vetted", () => {
    for (const { page } of entries) {
      expect(`${page.title} ${page.description}`, page.path).not.toMatch(/\b(reviewed|scanned|audited|vetted|guaranteed)\b/i);
    }
    for (const extension of getAllExtensions()) {
      expect(buildExtensionDescription(extension), extension.slug).not.toMatch(/\b(reviewed|scanned|audited|vetted|guaranteed)\b/i);
    }
  });

  it("gives every page a unique title and description", () => {
    const titles = entries.map(({ metadata }) => documentTitleOf(metadata));
    const descriptions = entries.map(({ page }) => page.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("uses an absolute title for the home page so the template does not repeat the site name", () => {
    expect(buildStaticPageMetadata(PAGE_SEO.home).title).toEqual({ absolute: PAGE_SEO.home.title });
    expect(buildStaticPageMetadata(PAGE_SEO.browse).title).toBe(PAGE_SEO.browse.title);
  });

  it("canonicalises browse to /browse/ regardless of query strings", () => {
    expect(buildStaticPageMetadata(PAGE_SEO.browse).alternates?.canonical).toBe(`${SITE_URL}/browse/`);
  });

  it("names the site banner explicitly, except where a page has its own image", () => {
    expect(buildStaticPageMetadata(PAGE_SEO.about).openGraph).toMatchObject({
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: SITE_BANNER_ALT, type: "image/png" }],
    });
    expect(buildStaticPageMetadata(PAGE_SEO.about).twitter).toMatchObject({
      images: [{ url: `${SITE_URL}/twitter-image`, alt: SITE_BANNER_ALT }],
    });
    expect(buildStaticPageMetadata(PAGE_SEO.ideas).openGraph).toMatchObject({
      images: [{ url: `${SITE_URL}/ideas/opengraph-image`, alt: PAGE_SEO.ideas.previewImage.alt }],
    });
    expect(buildStaticPageMetadata(PAGE_SEO.ideas).twitter).toMatchObject({
      images: [{ url: `${SITE_URL}/ideas/twitter-image`, alt: PAGE_SEO.ideas.previewImage.alt }],
    });
  });
});

describe("buildMetadata", () => {
  it("builds absolute URLs on the given site URL", () => {
    const metadata = buildMetadata({ title: "T", description: "D", path: "/x/" }, "https://example.test");
    expect(metadata.alternates?.canonical).toBe("https://example.test/x/");
  });

  it("keeps a page out of search results without a canonical when it is not indexable", () => {
    const metadata = buildMetadata({ title: "T", description: "D", path: "/x/", isIndexable: false });
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(metadata.alternates).not.toHaveProperty("canonical");
    expect(metadata.openGraph).not.toHaveProperty("url");
  });
});

describe("buildNotFoundMetadata", () => {
  it("is noindex", () => {
    const metadata = buildNotFoundMetadata();
    expect(metadata.robots).toMatchObject({ index: false });
    expect(documentTitleOf(metadata).length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });
});

describe("buildRootMetadata", () => {
  it("sets the metadata base, the title template and indexable robots", () => {
    const metadata = buildRootMetadata("https://example.test");
    expect(String(metadata.metadataBase)).toBe("https://example.test/");
    expect(metadata.title).toEqual({ default: PAGE_SEO.home.title, template: TITLE_TEMPLATE });
    expect(TITLE_TEMPLATE).toBe(`%s${TITLE_TEMPLATE_SUFFIX}`);
    expect(metadata.robots).toMatchObject({ index: true });
  });
});

describe("resolveVerification", () => {
  it("omits everything when nothing is set", () => {
    expect(resolveVerification({})).toBeUndefined();
    expect(resolveVerification({ google: undefined, bing: undefined })).toBeUndefined();
  });

  it("returns the Google token under google and the Bing token under msvalidate.01", () => {
    expect(resolveVerification({ google: "abcDEF123_-xyz" })).toEqual({ google: "abcDEF123_-xyz" });
    expect(resolveVerification({ bing: "0123456789ABCDEF" })).toEqual({ other: { "msvalidate.01": "0123456789ABCDEF" } });
    expect(resolveVerification({ google: "abcDEF123_-xyz", bing: "0123456789ABCDEF" })).toEqual({
      google: "abcDEF123_-xyz",
      other: { "msvalidate.01": "0123456789ABCDEF" },
    });
  });

  it("drops empty, too short and markup-carrying values", () => {
    expect(resolveVerification({ google: "" })).toBeUndefined();
    expect(resolveVerification({ google: "short" })).toBeUndefined();
    expect(resolveVerification({ google: '"><script>alert(1)</script>' })).toBeUndefined();
    expect(resolveVerification({ google: "bad value with spaces", bing: "0123456789ABCDEF" })).toEqual({
      other: { "msvalidate.01": "0123456789ABCDEF" },
    });
  });
});

describe("extension titles", () => {
  it("reads '<name>, a <kind> for Claude Code' when it fits", () => {
    expect(buildExtensionTitle({ name: "diff", kind: "mod" })).toEqual({
      title: "diff, a mod for Claude Code",
      hasAbsoluteTitle: false,
    });
    expect(buildExtensionTitle({ name: "code-architect", kind: "agent" }).title).toBe("code-architect, an agent for Claude Code");
    expect(buildExtensionTitle({ name: "Playwright MCP", kind: "mcp-server" }).title).toBe(
      "Playwright MCP, an MCP server for Claude Code",
    );
  });

  it("does not repeat the kind when the name already says it", () => {
    const result = buildExtensionTitle({ name: "Sequential Thinking MCP server", kind: "mcp-server" });
    expect(result).toEqual({ title: "Sequential Thinking MCP server for Claude Code", hasAbsoluteTitle: true });
    expect(tabTitleOf(result).length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });

  it("drops the site suffix, then the words, then clamps, as a name gets longer", () => {
    const long = buildExtensionTitle({ name: "A".repeat(38), kind: "hook" });
    expect(long.hasAbsoluteTitle).toBe(true);
    expect(tabTitleOf(long).length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    const huge = buildExtensionTitle({ name: "word ".repeat(40), kind: "hook" });
    expect(huge.title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });

  it("stays within 60 characters and unique for every catalog entry", () => {
    const titles = getAllExtensions().map((extension) => tabTitleOf(buildExtensionTitle(extension)));
    for (const title of titles) expect(title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("extension descriptions", () => {
  it("is the summary plus the publisher, at most 160 characters", () => {
    const description = buildExtensionDescription(builtInModExtension);
    expect(description.startsWith(builtInModExtension.summary)).toBe(true);
    expect(description).toContain("Published by Fixture Vendor.");
    expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
  });

  it("never describes a community listing as published by Anthropic", () => {
    const description = buildExtensionDescription(verifiedExtension);
    expect(description).toContain("Community listing, not published by Anthropic.");
    expect(description).not.toMatch(NOT_NEGATED_ANTHROPIC);
  });

  it("does not repeat a community publisher name that claims to be Anthropic", () => {
    const impostor: Extension["publisher"] = { name: "Anthropic Official", url: null, kind: "community" };
    const sentence = describePublisher(impostor);
    expect(sentence).toBe("Community listing, not published by Anthropic.");
    expect(sentence).not.toContain("Official");
  });

  it("states the publisher of an Anthropic entry as data says", () => {
    expect(describePublisher({ name: "Anthropic", url: null, kind: "anthropic" })).toBe("Published by Anthropic.");
  });

  it("drops the extra sentences instead of cutting a non-community summary that is already near the limit", () => {
    const summary = "S".repeat(150);
    const description = buildExtensionDescription({ summary, publisher: { name: "Vendor", url: null, kind: "mcp-project" } });
    expect(description).toBe(`${summary}.`);
  });

  it("keeps the community disclosure however long the summary is, shortening the summary first", () => {
    for (const length of [0, 40, 100, 130, 150, 160]) {
      const summary = length === 0 ? "x" : "word ".repeat(40).slice(0, length).trim();
      const description = buildExtensionDescription({ summary, publisher: verifiedExtension.publisher });
      expect(description, `summary of ${length}`).toContain(COMMUNITY_DISCLOSURE);
      expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    }
  });

  it("shortens a 160 character community summary with an ellipsis and keeps the disclosure at the end", () => {
    const summary = `${"abcdefghi ".repeat(20).slice(0, 159)}z`;
    expect(summary).toHaveLength(160);
    const description = buildExtensionDescription({ summary, publisher: verifiedExtension.publisher });
    expect(description.endsWith(COMMUNITY_DISCLOSURE)).toBe(true);
    expect(description).toContain(String.fromCharCode(0x2026));
    expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
  });

  it("keeps the disclosure for a community publisher that claims to be Anthropic, with a 160 character summary", () => {
    const impostor = { name: "Anthropic Official", url: null, kind: "community" as const };
    const description = buildExtensionDescription({ summary: "z".repeat(160), publisher: impostor });
    expect(description.endsWith(COMMUNITY_DISCLOSURE)).toBe(true);
    expect(description).not.toContain("Official");
  });

  it("cuts a summary that is longer than the limit on a word boundary", () => {
    const description = buildExtensionDescription({ summary: "word ".repeat(60), publisher: verifiedExtension.publisher });
    expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
  });

  it("normalises long dashes and whitespace from catalog text", () => {
    const description = buildExtensionDescription({
      summary: `Fast${String.fromCharCode(0x2014)}small\nand tidy`,
      publisher: verifiedExtension.publisher,
    });
    expect(DASH_PATTERN.test(description)).toBe(false);
    expect(description).not.toContain("\n");
  });

  it("is at most 160 characters, dash free and always disclosed for community entries across the catalog", () => {
    for (const extension of getAllExtensions()) {
      const description = buildExtensionDescription(extension);
      if (extension.publisher.kind === "community") expect(description).toContain(COMMUNITY_DISCLOSURE);
      expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
      expect(DASH_PATTERN.test(description)).toBe(false);
      if (extension.publisher.kind === "community") expect(description).not.toMatch(NOT_NEGATED_ANTHROPIC);
    }
  });
});

describe("buildExtensionMetadata", () => {
  it("derives title, description, canonical and Open Graph from the entry", () => {
    const metadata = buildExtensionMetadata(sourceOnlyExtension);
    // 44 characters: too long to keep the site suffix, so the title stands alone.
    expect(metadata.title).toEqual({ absolute: "Fixture Source Only, a skill for Claude Code" });
    expect(metadata.description).toContain(sourceOnlyExtension.summary);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/extensions/${sourceOnlyExtension.slug}/`);
    expect(metadata.openGraph).toMatchObject({ url: `${SITE_URL}/extensions/${sourceOnlyExtension.slug}/` });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("names the entry's own share image with its per-entry alt text", () => {
    const metadata = buildExtensionMetadata(builtInModExtension);
    const alt = buildEntryPreviewContent(builtInModExtension).alt;
    expect(alt).toContain(builtInModExtension.name);
    expect(metadata.openGraph).toMatchObject({
      images: [{ url: `${SITE_URL}/extensions/${builtInModExtension.slug}/opengraph-image`, alt, width: 1200, height: 630 }],
    });
    expect(metadata.twitter).toMatchObject({
      images: [{ url: `${SITE_URL}/extensions/${builtInModExtension.slug}/twitter-image`, alt }],
    });
  });

  it("points only at image routes that exist in the app folder", () => {
    const routeFolderOf = (url: string): string => {
      const segments = new URL(url).pathname.split("/").filter(Boolean);
      const isEntryRoute = segments[0] === "extensions";
      return path.join(process.cwd(), "src", "app", ...segments.slice(0, -1).map((segment, index) => (isEntryRoute && index === 1 ? "[slug]" : segment)));
    };
    const metadataList = [
      buildExtensionMetadata(builtInModExtension),
      buildStaticPageMetadata(PAGE_SEO.ideas),
      buildStaticPageMetadata(PAGE_SEO.about),
    ];
    for (const metadata of metadataList) {
      for (const [file, images] of [
        ["opengraph-image", (metadata.openGraph as { images: { url: string }[] }).images],
        ["twitter-image", (metadata.twitter as { images: { url: string }[] }).images],
      ] as const) {
        const folder = routeFolderOf(images[0].url);
        expect(existsSync(path.join(folder, `${file}.tsx`)), `${folder}/${file}`).toBe(true);
      }
    }
  });

  it("keeps a mod's kind in its title even when its name holds part of the kind word", () => {
    expect(buildExtensionTitle({ name: "agents-md", kind: "agent" }).title).toBe("agents-md, an agent for Claude Code");
    expect(buildExtensionTitle({ name: "modular-hooks", kind: "mod" }).title).toBe("modular-hooks, a mod for Claude Code");
    expect(buildExtensionTitle({ name: "Plugin Toolkit", kind: "plugin" }).title).toBe("Plugin Toolkit for Claude Code");
    expect(buildExtensionTitle({ name: "Some MCP server", kind: "mcp-server" }).title).toBe("Some MCP server for Claude Code");
  });

  it("has an absolute trailing-slash canonical for every catalog entry", () => {
    for (const extension of getAllExtensions()) {
      expect(buildExtensionMetadata(extension).alternates?.canonical).toMatch(/^https?:\/\/[^/]+\/extensions\/[a-z0-9-]+\/$/);
    }
  });
});
