import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { CATALOG_JSON_CONTENT_TYPE, buildCatalogJson } from "@/lib/seo/catalogJson";

// Required for `output: "export"`: rendered once at build time and served as a static file.
export const dynamic = "force-static";

export function GET(): Response {
  const catalogDocument = buildCatalogJson({ extensions: getAllExtensions(), generatedAt: getCatalogGeneratedAt() });
  return new Response(JSON.stringify(catalogDocument), { headers: { "Content-Type": CATALOG_JSON_CONTENT_TYPE } });
}
