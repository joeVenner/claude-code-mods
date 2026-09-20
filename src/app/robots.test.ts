import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/site";
import robots, { dynamic } from "./robots";

describe("robots", () => {
  it("is statically rendered for the export build", () => {
    expect(dynamic).toBe("force-static");
  });

  it("allows all crawlers and points at the sitemap", () => {
    const result = robots();
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
