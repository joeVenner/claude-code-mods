// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import { getAllExtensions } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";
import { GET as getFeed, dynamic as feedDynamic } from "./feed.xml/route";
import { GET as getLlmsFull, dynamic as llmsFullDynamic } from "./llms-full.txt/route";
import { GET as getLlms, dynamic as llmsDynamic } from "./llms.txt/route";

describe("llms.txt route", () => {
  it("is static and served as UTF-8 plain text", async () => {
    expect(llmsDynamic).toBe("force-static");
    const response = getLlms();
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    const body = await response.text();
    expect(body.startsWith("# Claude Code Mods\n")).toBe(true);
    expect(DASH_PATTERN.test(body)).toBe(false);
  });

  it("links every catalog entry once", async () => {
    const body = await getLlms().text();
    for (const extension of getAllExtensions()) {
      expect(body.split(`](${SITE_URL}/extensions/${extension.slug}/)`)).toHaveLength(2);
    }
  });
});

describe("llms-full.txt route", () => {
  it("is static and served as UTF-8 plain text with every entry", async () => {
    expect(llmsFullDynamic).toBe("force-static");
    const response = getLlmsFull();
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    const body = await response.text();
    for (const extension of getAllExtensions()) {
      expect(body.split(`- Page: ${SITE_URL}/extensions/${extension.slug}/\n`)).toHaveLength(2);
    }
    expect(DASH_PATTERN.test(body)).toBe(false);
  });
});

describe("feed.xml route", () => {
  it("is static and served as an Atom document", async () => {
    expect(feedDynamic).toBe("force-static");
    const response = getFeed();
    expect(response.headers.get("content-type")).toBe("application/atom+xml; charset=utf-8");
    const body = await response.text();
    expect(body).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(body.split("<entry>")).toHaveLength(Math.min(getAllExtensions().length, 50) + 1);
  });
});
