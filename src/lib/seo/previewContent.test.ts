import { describe, expect, it } from "vitest";
import { builtInModExtension, sourceOnlyExtension, verifiedExtension } from "@/components/catalog/__fixtures__/extensions";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import { getAllExtensions } from "@/lib/catalog";
import type { Extension } from "@/lib/types";
import {
  MAX_PREVIEW_NAME_LENGTH,
  MAX_PREVIEW_PUBLISHER_LENGTH,
  MAX_PREVIEW_SUMMARY_LENGTH,
  PREVIEW_HOST,
  PREVIEW_IMAGE_SIZE,
  buildEntryPreviewContent,
  buildIdeasPreviewContent,
  previewTitleFontSize,
} from "./previewContent";

describe("buildEntryPreviewContent", () => {
  it("shows kind, name, summary and publisher", () => {
    const content = buildEntryPreviewContent(sourceOnlyExtension);
    expect(content.eyebrow).toBe("SKILL");
    expect(content.title).toBe("Fixture Source Only");
    expect(content.summary).toBe(sourceOnlyExtension.summary);
    expect(content.byline).toBe("By Fixture Publisher");
  });

  it("tags built-in entries with Built in", () => {
    expect(buildEntryPreviewContent(builtInModExtension).tags).toEqual(["Built in"]);
  });

  it("tags community publishers with Community listing", () => {
    expect(buildEntryPreviewContent(verifiedExtension).tags).toEqual(["Community listing"]);
  });

  it("has no tag for an installable entry from a project", () => {
    const projectEntry = { ...verifiedExtension, publisher: { ...verifiedExtension.publisher, kind: "mcp-project" as const } };
    expect(buildEntryPreviewContent(projectEntry).tags).toEqual([]);
  });

  it("clamps long text and normalises dashes", () => {
    const long: Extension = {
      ...verifiedExtension,
      name: "word ".repeat(50),
      summary: `${"summary ".repeat(40)}${String.fromCharCode(0x2014)}`,
      publisher: { ...verifiedExtension.publisher, name: "publisher ".repeat(20) },
    };
    const content = buildEntryPreviewContent(long);
    expect(content.title.length).toBeLessThanOrEqual(MAX_PREVIEW_NAME_LENGTH);
    expect(content.summary.length).toBeLessThanOrEqual(MAX_PREVIEW_SUMMARY_LENGTH);
    expect(content.byline.length).toBeLessThanOrEqual(MAX_PREVIEW_PUBLISHER_LENGTH + "By ".length);
    expect(DASH_PATTERN.test(`${content.title}${content.summary}${content.alt}`)).toBe(false);
  });

  it("keeps hostile markup as inert text and never adds any of its own", () => {
    const hostile: Extension = { ...verifiedExtension, name: "<img src=x onerror=alert(1)>", summary: "</div><script>x</script>" };
    const content = buildEntryPreviewContent(hostile);
    expect(content.title).toBe("<img src=x onerror=alert(1)>");
    expect(content.summary).toBe("</div><script>x</script>");
    // Every field is a plain string; nothing here can be interpreted as markup by a renderer.
    for (const value of [content.eyebrow, content.title, content.summary, content.byline, content.alt, ...content.tags]) {
      expect(typeof value).toBe("string");
    }
  });

  it("produces bounded content for every catalog entry", () => {
    for (const extension of getAllExtensions()) {
      const content = buildEntryPreviewContent(extension);
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.title.length).toBeLessThanOrEqual(MAX_PREVIEW_NAME_LENGTH);
      expect(content.summary.length).toBeLessThanOrEqual(MAX_PREVIEW_SUMMARY_LENGTH);
    }
  });
});

describe("buildEntryPreviewContent with text the fonts cannot draw", () => {
  it("falls back to the slug when nothing in the name can be drawn", () => {
    const content = buildEntryPreviewContent({ ...verifiedExtension, slug: "cjk-tool", name: String.fromCodePoint(0x65e5, 0x672c, 0x8a9e) });
    expect(content.title).toBe("cjk-tool");
  });

  it("drops emoji and non-Latin text from summary and publisher and leaves an empty byline when nothing remains", () => {
    const content = buildEntryPreviewContent({
      ...verifiedExtension,
      summary: `Fast ${String.fromCodePoint(0x1f680)} tool ${String.fromCodePoint(0x4e2d, 0x6587)}`,
      publisher: { ...verifiedExtension.publisher, name: String.fromCodePoint(0x1f680) },
    });
    expect(content.summary).toBe("Fast tool");
    expect(content.byline).toBe("");
  });
});

describe("buildIdeasPreviewContent", () => {
  it("derives the count from its argument", () => {
    expect(buildIdeasPreviewContent(3).summary.startsWith("3 proposals")).toBe(true);
    expect(buildIdeasPreviewContent(0).summary.startsWith("0 proposals")).toBe(true);
  });

  it("says they are not installable", () => {
    expect(buildIdeasPreviewContent(2).tags).toEqual(["Not installable"]);
  });
});

describe("previewTitleFontSize", () => {
  it("shrinks as names get longer and never grows back", () => {
    const sizes = [5, 22, 23, 34, 35, 48, 49, 64].map(previewTitleFontSize);
    expect(sizes).toEqual([...sizes].sort((left, right) => right - left));
    expect(sizes[0]).toBeGreaterThan(sizes[sizes.length - 1]);
  });
});

describe("preview constants", () => {
  it("uses the 1200 by 630 size social networks expect and the production host", () => {
    expect(PREVIEW_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
    expect(PREVIEW_HOST).toBe("claudecodemods.com");
  });
});
