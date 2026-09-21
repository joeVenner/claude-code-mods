import type { MetadataRoute } from "next";
import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { getIdeasCheckedAt } from "@/lib/ideas";
import { NAV_LINKS, SITE_URL } from "@/lib/site";
import { extensionPath } from "@/lib/seo/metadata";
import { PAGE_SEO, STATIC_PAGE_KEYS } from "@/lib/seo/pages";

// Required for `output: "export"`: the file must be rendered once at build time.
export const dynamic = "force-static";

type SitemapEntry = MetadataRoute.Sitemap[number];
type StaticPagePlan = Pick<SitemapEntry, "changeFrequency" | "priority">;

/** Per static page, how often it changes and how much it matters. Typed over every page key. */
const STATIC_PAGE_PLAN: Readonly<Record<keyof typeof PAGE_SEO, StaticPagePlan>> = {
  home: { changeFrequency: "weekly", priority: 1 },
  browse: { changeFrequency: "weekly", priority: 0.9 },
  hooks: { changeFrequency: "weekly", priority: 0.6 },
  ideas: { changeFrequency: "monthly", priority: 0.5 },
  security: { changeFrequency: "monthly", priority: 0.6 },
  publish: { changeFrequency: "monthly", priority: 0.6 },
  about: { changeFrequency: "monthly", priority: 0.5 },
};

/** Mods are what the site is about, so their pages rank above the other kinds. */
const MOD_PRIORITY = 0.8;
const EXTENSION_PRIORITY = 0.6;

/** Nav destinations that have no entry in `PAGE_SEO` yet still get indexed, so a new nav link is never missed. */
function unlistedNavPaths(): readonly string[] {
  const listed = new Set<string>(STATIC_PAGE_KEYS.map((key) => PAGE_SEO[key].path));
  return NAV_LINKS.map((link) => link.href).filter((href) => !listed.has(href));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const catalogDate = getCatalogGeneratedAt();
  const ideasDate = getIdeasCheckedAt();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGE_KEYS.map((key) => ({
    url: `${SITE_URL}${PAGE_SEO[key].path}`,
    lastModified: key === "ideas" ? ideasDate : catalogDate,
    ...STATIC_PAGE_PLAN[key],
  }));
  const navEntries: MetadataRoute.Sitemap = unlistedNavPaths().map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: catalogDate,
    changeFrequency: "monthly",
    priority: 0.5,
  }));
  const extensionEntries: MetadataRoute.Sitemap = getAllExtensions().map((extension) => ({
    url: `${SITE_URL}${extensionPath(extension.slug)}`,
    lastModified: extension.verification.checkedAt,
    changeFrequency: "monthly",
    priority: extension.kind === "mod" ? MOD_PRIORITY : EXTENSION_PRIORITY,
  }));
  return [...staticEntries, ...navEntries, ...extensionEntries];
}
