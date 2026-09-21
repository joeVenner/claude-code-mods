import { describe, expect, it } from "vitest";
import { builtInModExtension, sourceOnlyExtension, verifiedExtension } from "@/components/catalog/__fixtures__/extensions";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";
import type { Extension } from "@/lib/types";
import { FEED_MAX_ENTRIES, buildAtomFeed, escapeXml, sortByNewestCheck } from "./feed";

const ATOM_NAMESPACE = "http://www.w3.org/2005/Atom";

function withDate(extension: Extension, checkedAt: string): Extension {
  return { ...extension, verification: { ...extension.verification, checkedAt } };
}

function parse(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function isWellFormed(document: Document): boolean {
  return document.getElementsByTagName("parsererror").length === 0;
}

describe("escapeXml", () => {
  it("escapes the five XML special characters", () => {
    expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;");
  });

  it("removes control characters that XML forbids", () => {
    expect(escapeXml(`a${String.fromCharCode(0)}b${String.fromCharCode(8)}c`)).toBe("abc");
  });
});

describe("sortByNewestCheck", () => {
  it("orders by check date, newest first", () => {
    const sorted = sortByNewestCheck([
      withDate(verifiedExtension, "2026-05-01"),
      withDate(sourceOnlyExtension, "2026-07-01"),
      withDate(builtInModExtension, "2026-06-01"),
    ]);
    expect(sorted.map((extension) => extension.slug)).toEqual([
      sourceOnlyExtension.slug,
      builtInModExtension.slug,
      verifiedExtension.slug,
    ]);
  });

  it("breaks ties by name so the order is deterministic", () => {
    const tied = [withDate(sourceOnlyExtension, "2026-06-01"), withDate(builtInModExtension, "2026-06-01")];
    const forward = sortByNewestCheck(tied).map((extension) => extension.name);
    const backward = sortByNewestCheck([...tied].reverse()).map((extension) => extension.name);
    expect(forward).toEqual(backward);
    expect(forward[0].localeCompare(forward[1])).toBeLessThan(0);
  });

  it("does not modify its input", () => {
    const input = [withDate(verifiedExtension, "2026-05-01"), withDate(builtInModExtension, "2026-06-01")];
    const copy = [...input];
    sortByNewestCheck(input);
    expect(input).toEqual(copy);
  });

  it("returns an empty list for no entries", () => {
    expect(sortByNewestCheck([])).toEqual([]);
  });
});

describe("buildAtomFeed", () => {
  const feed = buildAtomFeed({ extensions: getAllExtensions(), generatedAt: getCatalogGeneratedAt() });
  const document = parse(feed);

  it("is well-formed XML in the Atom namespace", () => {
    expect(isWellFormed(document)).toBe(true);
    expect(document.documentElement.localName).toBe("feed");
    expect(document.documentElement.namespaceURI).toBe(ATOM_NAMESPACE);
    expect(feed.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
  });

  it("takes the feed's updated time from its newest entry", () => {
    const updated = Array.from(document.documentElement.children).find((child) => child.localName === "updated");
    const newest = [...getAllExtensions()].map((entry) => entry.verification.checkedAt).sort().reverse()[0];
    expect(updated?.textContent).toBe(`${newest}T00:00:00Z`);
  });

  it("uses the catalog date for updated only when there are no entries", () => {
    const empty = buildAtomFeed({ extensions: [], generatedAt: "2026-03-04" });
    expect(empty).toContain("<updated>2026-03-04T00:00:00Z</updated>");
    const older = buildAtomFeed({ extensions: [withDate(verifiedExtension, "2026-01-01")], generatedAt: "2026-09-09" });
    expect(older).toContain("<updated>2026-01-01T00:00:00Z</updated>");
    expect(older).not.toContain("2026-09-09");
  });

  it("lists at most the 50 newest entries", () => {
    const many: Extension[] = Array.from({ length: FEED_MAX_ENTRIES + 20 }, (_, index) => ({
      ...verifiedExtension,
      slug: `entry-${index}`,
      name: `Entry ${index}`,
      verification: { ...verifiedExtension.verification, checkedAt: `2026-01-${String((index % 28) + 1).padStart(2, "0")}` },
    }));
    const parsed = parse(buildAtomFeed({ extensions: many, generatedAt: "2026-01-01" }));
    const entries = Array.from(parsed.getElementsByTagName("entry"));
    expect(FEED_MAX_ENTRIES).toBe(50);
    expect(entries).toHaveLength(FEED_MAX_ENTRIES);
    const times = entries.map((entry) => entry.getElementsByTagName("updated")[0].textContent ?? "");
    expect(times).toEqual([...times].sort().reverse());
    const oldestKept = times[times.length - 1];
    const dropped = sortByNewestCheck(many).slice(FEED_MAX_ENTRIES).map((entry) => `${entry.verification.checkedAt}T00:00:00Z`);
    for (const time of dropped) expect(time <= oldestKept).toBe(true);
  });

  it("has one entry per extension up to the cap, with absolute URLs and valid times", () => {
    const entries = Array.from(document.getElementsByTagName("entry"));
    expect(entries).toHaveLength(Math.min(getAllExtensions().length, FEED_MAX_ENTRIES));
    for (const entry of entries) {
      const link = entry.getElementsByTagName("link")[0].getAttribute("href") ?? "";
      expect(link.startsWith(`${SITE_URL}/extensions/`)).toBe(true);
      expect(link.endsWith("/")).toBe(true);
      expect(entry.getElementsByTagName("id")[0].textContent).toBe(link);
      const updated = entry.getElementsByTagName("updated")[0].textContent ?? "";
      expect(Number.isNaN(Date.parse(updated))).toBe(false);
    }
  });

  it("lists entries newest check first", () => {
    const times = Array.from(document.getElementsByTagName("entry")).map(
      (entry) => entry.getElementsByTagName("updated")[0].textContent ?? "",
    );
    expect(times).toEqual([...times].sort().reverse());
  });

  it("links itself and the site", () => {
    const links = Array.from(document.documentElement.children).filter((child) => child.localName === "link");
    expect(links.map((link) => link.getAttribute("rel"))).toEqual(["self", "alternate"]);
    expect(links[0].getAttribute("href")).toBe(`${SITE_URL}/feed.xml`);
  });

  it("contains no long dashes", () => {
    expect(DASH_PATTERN.test(feed)).toBe(false);
  });

  it("escapes hostile catalog text and parses back to the original text", () => {
    const name = `<script>alert("x")</script> & co`;
    const hostile: Extension = { ...verifiedExtension, name, summary: "Sum ]]> <b>bold</b> & more" };
    const xml = buildAtomFeed({ extensions: [hostile], generatedAt: "2026-01-01" });
    expect(xml).not.toContain("<script>");
    const parsed = parse(xml);
    expect(isWellFormed(parsed)).toBe(true);
    expect(parsed.getElementsByTagName("entry")[0].getElementsByTagName("title")[0].textContent).toBe(name);
  });

  it("stays well-formed when catalog text holds noncharacters and lone surrogates", () => {
    const bad = `Bad ${String.fromCharCode(0xffff)}${String.fromCharCode(0xfdd0)}${String.fromCharCode(0xd800)} name`;
    const hostile: Extension = { ...verifiedExtension, name: bad, summary: bad };
    const xml = buildAtomFeed({ extensions: [hostile], generatedAt: "2026-01-01" });
    expect(isWellFormed(parse(xml))).toBe(true);
    expect(xml.isWellFormed()).toBe(true);
    expect(xml).not.toContain(String.fromCharCode(0xffff));
  });

  it("keeps the community disclosure in the feed summary even for a 160 character summary", () => {
    const long: Extension = { ...verifiedExtension, summary: "word ".repeat(40).slice(0, 160).trim() };
    const parsed = parse(buildAtomFeed({ extensions: [long], generatedAt: "2026-01-01" }));
    const summary = parsed.getElementsByTagName("summary")[0].textContent ?? "";
    expect(summary).toContain("Community listing, not published by Anthropic.");
  });

  it("is still a valid feed with no entries", () => {
    const empty = parse(buildAtomFeed({ extensions: [], generatedAt: "2026-01-01" }));
    expect(isWellFormed(empty)).toBe(true);
    expect(empty.getElementsByTagName("entry")).toHaveLength(0);
  });

  it("uses the injected site URL", () => {
    const xml = buildAtomFeed({ extensions: [verifiedExtension], generatedAt: "2026-01-01", siteUrl: "https://example.test" });
    expect(xml).toContain("https://example.test/extensions/fixture-lint-runner/");
    expect(xml).not.toContain(SITE_URL);
  });
});
