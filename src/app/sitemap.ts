import type { MetadataRoute } from "next";
import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { NAV_LINKS, SITE_URL } from "@/lib/site";

// Required for `output: "export"`: the file must be rendered once at build time.
export const dynamic = "force-static";

/** Home plus every top-level nav destination; derived so a new nav link is indexed automatically. */
const STATIC_ROUTES: readonly string[] = ["/", ...NAV_LINKS.map((link) => link.href)];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = getCatalogGeneratedAt();
  const extensionRoutes = getAllExtensions().map((extension) => `/extensions/${extension.slug}/`);
  return [...STATIC_ROUTES, ...extensionRoutes].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
  }));
}
