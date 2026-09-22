import { INDEXNOW_KEY } from "@/lib/seo/indexNow";

// Required for `output: "export"`: rendered once at build time and served as a static file.
export const dynamic = "force-static";

/**
 * IndexNow ownership proof. The path must be exactly `/<key>.txt`, so this folder is named after the
 * literal key rather than taking it as a route parameter. `src/lib/seo/indexNow.test.ts` asserts this
 * folder name matches `INDEXNOW_KEY_FILENAME`, so the two can never drift apart.
 */
export function GET(): Response {
  return new Response(INDEXNOW_KEY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
