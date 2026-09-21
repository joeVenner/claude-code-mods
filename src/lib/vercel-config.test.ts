import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface HeaderRule {
  readonly source: string;
  readonly headers: readonly { readonly key: string; readonly value: string }[];
}

const config = JSON.parse(readFileSync(path.join(process.cwd(), "vercel.json"), "utf8")) as {
  readonly headers: readonly HeaderRule[];
};

function valueOf(rule: HeaderRule, key: string): string | undefined {
  return rule.headers.find((header) => header.key.toLowerCase() === key.toLowerCase())?.value;
}

describe("vercel.json", () => {
  const globalRule = config.headers.find((rule) => rule.source === "/(.*)");

  it("sets a strict Content-Security-Policy for every path", () => {
    const policy = valueOf(globalRule as HeaderRule, "Content-Security-Policy");
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("sets the other security headers", () => {
    for (const key of ["Strict-Transport-Security", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
      expect(valueOf(globalRule as HeaderRule, key), key).toBeTruthy();
    }
  });

  it("serves the extension-less generated images as PNG, because static hosts cannot infer the type", () => {
    const rule = config.headers.find((candidate) => candidate.source.includes("opengraph-image"));
    expect(rule).toBeDefined();
    expect(valueOf(rule as HeaderRule, "Content-Type")).toBe("image/png");
    for (const name of ["opengraph-image", "twitter-image", "icon", "apple-icon"]) {
      expect((rule as HeaderRule).source).toContain(name);
    }
  });

  it("serves the feed and the llms files with explicit types and utf-8", () => {
    const feed = config.headers.find((rule) => rule.source === "/feed.xml");
    expect(valueOf(feed as HeaderRule, "Content-Type")).toBe("application/atom+xml; charset=utf-8");
    const llms = config.headers.find((rule) => rule.source.includes("llms.txt"));
    expect(valueOf(llms as HeaderRule, "Content-Type")).toBe("text/plain; charset=utf-8");
  });
});
