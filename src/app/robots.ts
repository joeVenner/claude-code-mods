import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Crawlers named on purpose. The directory wants to be found and cited, so search engines and the
 * crawlers that feed AI search and assistants are all allowed. The wildcard rule already permits
 * them; naming them keeps that intent visible and survives a future change to the default rule.
 */
export const ALLOWED_CRAWLERS: readonly string[] = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: [...ALLOWED_CRAWLERS], allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
