import { describe, expect, it } from "vitest";
import { ALLOWED_CATALOG_HOSTS, assertSafeHref, classifyHref, isAllowedCatalogUrl } from "@/lib/url";

describe("isAllowedCatalogUrl", () => {
  it.each([
    "https://github.com/anthropics/claude-code",
    "https://code.claude.com/docs/en/plugins",
  ])("accepts %s", (url) => {
    expect(isAllowedCatalogUrl(url)).toBe(true);
  });

  it.each([
    ["plain http", "http://github.com/example"],
    ["other scheme", "ftp://github.com/example"],
    ["javascript scheme", "javascript:alert(1)"],
    ["unlisted host", "https://example.com/page"],
    ["raw content host, used only by the verify script", "https://raw.githubusercontent.com/a/b/main/x.json"],
    ["look-alike subdomain", "https://github.com.evil.example/x"],
    ["look-alike prefix", "https://evilgithub.com/x"],
    ["credentials in userinfo", "https://user:pass@github.com/x"],
    ["userinfo phishing form", "https://github.com@evil.example/x"],
    ["custom port", "https://github.com:8443/x"],
    ["not a URL", "github.com/example"],
    ["empty string", ""],
  ])("rejects %s", (_label, url) => {
    expect(isAllowedCatalogUrl(url)).toBe(false);
  });

  it("only allows hosts that the catalog actually needs", () => {
    expect(ALLOWED_CATALOG_HOSTS).toEqual(["github.com", "code.claude.com"]);
  });
});

describe("classifyHref", () => {
  it.each([
    ["/browse/", "internal"],
    ["/browse/?kind=plugin", "internal"],
    ["#main", "anchor"],
    ["https://example.com/docs", "external"],
  ])("classifies %s as %s", (href, expected) => {
    expect(classifyHref(href)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,x",
    "mailto:a@b.co",
    "//evil.example",
    "/\\evil.example",
    "http://plain.example",
    "https://user:pw@example.com",
    "relative/path",
    "",
  ])("classifies %j as unsafe", (href) => {
    expect(classifyHref(href)).toBe("unsafe");
  });
});

describe("assertSafeHref", () => {
  it("returns a safe href unchanged", () => {
    expect(assertSafeHref("/security/")).toBe("/security/");
  });

  it("throws with the offending value for an unsafe href", () => {
    expect(() => assertSafeHref("javascript:alert(1)")).toThrow(/Unsafe href rejected.*javascript/);
  });
});
