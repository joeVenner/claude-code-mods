import { describe, expect, it } from "vitest";
import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { getIdeasCheckedAt } from "@/lib/ideas";
import { NAV_LINKS, SITE_URL } from "@/lib/site";
import { PAGE_SEO, STATIC_PAGE_KEYS } from "@/lib/seo/pages";
import sitemap, { dynamic } from "./sitemap";

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);
  const byUrl = new Map(entries.map((entry) => [entry.url, entry]));

  it("is statically rendered for the export build", () => {
    expect(dynamic).toBe("force-static");
  });

  it("includes home, every static page and every nav destination under the site URL", () => {
    expect(urls).toContain(`${SITE_URL}/`);
    for (const key of STATIC_PAGE_KEYS) expect(urls).toContain(`${SITE_URL}${PAGE_SEO[key].path}`);
    for (const link of NAV_LINKS) expect(urls).toContain(`${SITE_URL}${link.href}`);
  });

  it("includes the ideas page once, and no per-idea urls", () => {
    expect(urls.filter((url) => url === `${SITE_URL}/ideas/`)).toHaveLength(1);
    expect(urls.some((url) => url.includes("#"))).toBe(false);
  });

  it("includes every extension slug exactly once", () => {
    for (const extension of getAllExtensions()) {
      expect(urls.filter((url) => url === `${SITE_URL}/extensions/${extension.slug}/`)).toHaveLength(1);
    }
  });

  it("uses absolute URLs, has no duplicates and skips machine files", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url.startsWith(`${SITE_URL}/`)).toBe(true);
      expect(url).not.toMatch(/llms|feed\.xml|\.txt$|\?/);
    }
  });

  it("dates every entry with a valid date: check date per extension, catalog date for pages", () => {
    for (const entry of entries) {
      expect(Number.isNaN(Date.parse(String(entry.lastModified)))).toBe(false);
    }
    for (const extension of getAllExtensions()) {
      expect(byUrl.get(`${SITE_URL}/extensions/${extension.slug}/`)?.lastModified).toBe(extension.verification.checkedAt);
    }
    expect(byUrl.get(`${SITE_URL}/`)?.lastModified).toBe(getCatalogGeneratedAt());
    expect(byUrl.get(`${SITE_URL}/security/`)?.lastModified).toBe(getCatalogGeneratedAt());
    expect(byUrl.get(`${SITE_URL}/ideas/`)?.lastModified).toBe(getIdeasCheckedAt());
  });

  it("gives every entry a change frequency and a priority between 0 and 1", () => {
    for (const entry of entries) {
      expect(entry.changeFrequency).toBeDefined();
      expect(entry.priority).toBeGreaterThan(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it("ranks home first and mods above the other kinds", () => {
    expect(byUrl.get(`${SITE_URL}/`)?.priority).toBe(1);
    const modPriorities = new Set<number>();
    const otherPriorities = new Set<number>();
    for (const extension of getAllExtensions()) {
      const priority = byUrl.get(`${SITE_URL}/extensions/${extension.slug}/`)?.priority ?? 0;
      (extension.kind === "mod" ? modPriorities : otherPriorities).add(priority);
    }
    expect(modPriorities.size).toBe(1);
    expect(otherPriorities.size).toBe(1);
    expect([...modPriorities][0]).toBeGreaterThan([...otherPriorities][0]);
    expect([...modPriorities][0]).toBeLessThan(1);
  });
});
