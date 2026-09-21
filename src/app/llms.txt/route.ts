import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { getIdeas, getIdeasCheckedAt } from "@/lib/ideas";
import { buildLlmsTxt } from "@/lib/seo/llms";

// Required for `output: "export"`: rendered once at build time and served as a static file.
export const dynamic = "force-static";

export function GET(): Response {
  const body = buildLlmsTxt({
    extensions: getAllExtensions(),
    ideas: getIdeas(),
    generatedAt: getCatalogGeneratedAt(),
    ideasCheckedAt: getIdeasCheckedAt(),
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
