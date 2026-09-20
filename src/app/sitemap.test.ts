import { describe, expect, it } from "vitest";
import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { NAV_LINKS, SITE_URL } from "@/lib/site";
import sitemap, { dynamic } from "./sitemap";

describe("sitemap", () => {
  const urls = sitemap().map((entry) => entry.url);

  it("is statically rendered for the export build", () => {
    expect(dynamic).toBe("force-static");
  });

  it("includes home and every nav destination under the site URL", () => {
    expect(urls).toContain(`${SITE_URL}/`);
    for (const link of NAV_LINKS) {
      expect(urls).toContain(`${SITE_URL}${link.href}`);
    }
  });

  it("includes every extension slug exactly once", () => {
    for (const extension of getAllExtensions()) {
      expect(urls.filter((url) => url === `${SITE_URL}/extensions/${extension.slug}/`)).toHaveLength(1);
    }
  });

  it("has no duplicate urls and uses the catalog date as lastModified", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const entry of sitemap()) {
      expect(entry.lastModified).toBe(getCatalogGeneratedAt());
    }
  });
});
