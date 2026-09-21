import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface HeaderRule {
  readonly source: string;
  readonly headers: readonly { readonly key: string; readonly value: string }[];
}

const config = JSON.parse(readFileSync(path.join(process.cwd(), "vercel.json"), "utf8")) as {
  readonly buildCommand?: string;
  readonly installCommand?: string;
  readonly outputDirectory?: string;
  readonly headers: readonly HeaderRule[];
};

// Vercel reads every `source` with path-to-regexp, not RegExp. Next ships a compiled copy of that
// library, so a pattern that throws here is one Vercel refuses to deploy ("invalid route source
// pattern"). An optional unnamed group such as `(.*/)?` did exactly that once.
const require = createRequire(import.meta.url);
const { pathToRegexp } = require("next/dist/compiled/path-to-regexp") as {
  pathToRegexp: (source: string) => RegExp;
};

function valueOf(rule: HeaderRule, key: string): string | undefined {
  return rule.headers.find((header) => header.key.toLowerCase() === key.toLowerCase())?.value;
}

function rulesMatching(urlPath: string): readonly HeaderRule[] {
  return config.headers.filter((rule) => pathToRegexp(rule.source).test(urlPath));
}

function contentTypeFor(urlPath: string): string | undefined {
  return rulesMatching(urlPath)
    .map((rule) => valueOf(rule, "Content-Type"))
    .find((value): value is string => value !== undefined);
}

describe("vercel.json build settings", () => {
  // The first Vercel deploy built fine and then failed with "No Output Directory named public found",
  // because a project created with the generic "Other" preset looks in ./public while `next build` with
  // output: "export" writes to ./out. The repo has to say where the site is, whatever the dashboard says.
  it("points Vercel at the directory a Next.js static export writes to", () => {
    const nextConfig = readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");
    expect(nextConfig).toMatch(/output:\s*"export"/);
    expect(config.outputDirectory).toBe("out");
  });

  it("builds with the same commands as CI", () => {
    expect(config.buildCommand).toBe("npm run build");
    expect(config.installCommand).toBe("npm ci --ignore-scripts");
  });
});

describe("vercel.json headers", () => {
  const globalRule = config.headers.find((rule) => rule.source === "/(.*)");

  it("uses only source patterns that path-to-regexp accepts, so Vercel will deploy it", () => {
    for (const rule of config.headers) {
      expect(() => pathToRegexp(rule.source), rule.source).not.toThrow();
    }
  });

  it("keeps sources to exact paths and named segments, apart from the catch-all", () => {
    for (const rule of config.headers) {
      if (rule.source === "/(.*)") continue;
      expect(rule.source, "no groups, modifiers or wildcards outside the catch-all").toMatch(/^\/[A-Za-z0-9._\-/:]+$/);
    }
  });

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

  it.each([
    "/opengraph-image",
    "/twitter-image",
    "/icon",
    "/apple-icon",
    "/extensions/diff/opengraph-image",
    "/extensions/a-b-c/twitter-image",
    "/ideas/opengraph-image",
    "/ideas/twitter-image",
  ])("serves the extension-less generated image %s as PNG, because a static host cannot infer the type", (urlPath) => {
    expect(contentTypeFor(urlPath)).toBe("image/png");
  });

  it("does not give ordinary pages an image content type", () => {
    for (const urlPath of ["/", "/browse/", "/extensions/diff/", "/icons/icon-192.png"]) {
      expect(contentTypeFor(urlPath), urlPath).toBeUndefined();
    }
  });

  it("serves the feed and the llms files with explicit types and utf-8", () => {
    expect(contentTypeFor("/feed.xml")).toBe("application/atom+xml; charset=utf-8");
    expect(contentTypeFor("/llms.txt")).toBe("text/plain; charset=utf-8");
    expect(contentTypeFor("/llms-full.txt")).toBe("text/plain; charset=utf-8");
  });

  it("still applies the security headers on top of the type rules", () => {
    expect(rulesMatching("/extensions/diff/opengraph-image")).toContain(globalRule);
  });
});
