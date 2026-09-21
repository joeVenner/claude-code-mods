import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { buildAtomFeed } from "@/lib/seo/feed";

// Required for `output: "export"`: rendered once at build time and served as a static file.
export const dynamic = "force-static";

export function GET(): Response {
  const body = buildAtomFeed({ extensions: getAllExtensions(), generatedAt: getCatalogGeneratedAt() });
  return new Response(body, { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } });
}
