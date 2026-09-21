import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/site";
import robots, { ALLOWED_CRAWLERS, dynamic } from "./robots";

/** The crawlers the site wants to be found and cited by, as named in each vendor's documentation. */
const REQUIRED_CRAWLERS = [
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

describe("robots", () => {
  it("is statically rendered for the export build", () => {
    expect(dynamic).toBe("force-static");
  });

  it("points at the absolute sitemap URL", () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("allows every crawler by default", () => {
    const rules = [robots().rules].flat();
    expect(rules).toContainEqual({ userAgent: "*", allow: "/" });
  });

  it("names every search and AI crawler with an explicit allow rule", () => {
    expect([...ALLOWED_CRAWLERS].sort()).toEqual([...REQUIRED_CRAWLERS].sort());
    const rules = [robots().rules].flat();
    const named = rules.filter((rule) => Array.isArray(rule.userAgent));
    expect(named).toHaveLength(1);
    expect(named[0].userAgent).toEqual(REQUIRED_CRAWLERS);
    expect(named[0].allow).toBe("/");
  });

  it("disallows nothing", () => {
    for (const rule of [robots().rules].flat()) {
      expect(rule).not.toHaveProperty("disallow");
    }
  });
});
