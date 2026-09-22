// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildSubmissionPayload,
  DEFAULT_SITE_URL,
  extractSitemapUrls,
  isValidKey,
  parseArguments,
} from "../../scripts/lib/indexnow.mjs";

describe("parseArguments", () => {
  it("defaults to no URLs, not a dry run, and the live site", () => {
    expect(parseArguments([])).toEqual({ urls: [], dryRun: false, siteUrl: DEFAULT_SITE_URL });
  });

  it("collects repeated --url flags in order", () => {
    const options = parseArguments(["--url", "https://claudecodemods.com/", "--url", "https://claudecodemods.com/hooks/"]);
    expect(options.urls).toEqual(["https://claudecodemods.com/", "https://claudecodemods.com/hooks/"]);
  });

  it("reads --dry-run and --site", () => {
    expect(parseArguments(["--dry-run"]).dryRun).toBe(true);
    expect(parseArguments(["--site", "http://localhost:3000"]).siteUrl).toBe("http://localhost:3000");
  });

  it("throws on an unknown argument", () => {
    expect(() => parseArguments(["--bogus"])).toThrow(/unknown argument/);
  });
});

describe("isValidKey", () => {
  it("accepts 8 to 128 lowercase hex characters", () => {
    expect(isValidKey("a".repeat(8))).toBe(true);
    expect(isValidKey("a".repeat(128))).toBe(true);
    expect(isValidKey("73b087fe1cc34d7ca56436abb7d8bae9")).toBe(true);
  });

  it("rejects too short, too long, uppercase and non-hex characters", () => {
    expect(isValidKey("a".repeat(7))).toBe(false);
    expect(isValidKey("a".repeat(129))).toBe(false);
    expect(isValidKey("ABCDEF01")).toBe(false);
    expect(isValidKey("not-hex-at-all!!")).toBe(false);
  });
});

describe("extractSitemapUrls", () => {
  it("reads every <loc> in document order", () => {
    const xml =
      '<?xml version="1.0"?><urlset><url><loc>https://claudecodemods.com/</loc></url>' +
      "<url><loc>https://claudecodemods.com/hooks/</loc></url></urlset>";
    expect(extractSitemapUrls(xml)).toEqual(["https://claudecodemods.com/", "https://claudecodemods.com/hooks/"]);
  });

  it("returns an empty list for a sitemap with no entries", () => {
    expect(extractSitemapUrls('<?xml version="1.0"?><urlset></urlset>')).toEqual([]);
  });
});

describe("buildSubmissionPayload", () => {
  const key = "73b087fe1cc34d7ca56436abb7d8bae9";
  const urls = ["https://claudecodemods.com/", "https://claudecodemods.com/hooks/"];

  it("names the host, the key, the key file's URL, and the exact list given", () => {
    expect(buildSubmissionPayload({ urls, key, siteUrl: "https://claudecodemods.com" })).toEqual({
      host: "claudecodemods.com",
      key,
      keyLocation: "https://claudecodemods.com/73b087fe1cc34d7ca56436abb7d8bae9.txt",
      urlList: urls,
    });
  });

  it("refuses an empty list", () => {
    expect(() => buildSubmissionPayload({ urls: [], key, siteUrl: "https://claudecodemods.com" })).toThrow(/no URLs/);
  });

  it("refuses an invalid key", () => {
    expect(() => buildSubmissionPayload({ urls, key: "too-short", siteUrl: "https://claudecodemods.com" })).toThrow(/8 to 128/);
  });

  it("refuses a URL on a different host", () => {
    const offHost = [...urls, "https://example.com/"];
    expect(() => buildSubmissionPayload({ urls: offHost, key, siteUrl: "https://claudecodemods.com" })).toThrow(/not on claudecodemods\.com/);
  });
});
