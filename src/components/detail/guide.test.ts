import { describe, expect, it } from "vitest";
import type { GuideSection } from "@/lib/types";
import { GUIDE_ID_PREFIX, buildGuideAnchors, slugifyHeading } from "./guide";

function section(title: string): GuideSection {
  return { title, paragraphs: ["Body."], commands: [] };
}

describe("slugifyHeading", () => {
  it("lower-cases and hyphenates", () => {
    expect(slugifyHeading("Set up from source")).toBe("set-up-from-source");
  });

  it("drops punctuation, accents and edge hyphens", () => {
    expect(slugifyHeading("  Download: the source (v1)! ")).toBe("download-the-source-v1");
    expect(slugifyHeading("Café setup")).toBe("cafe-setup");
  });

  it("falls back when nothing usable remains", () => {
    expect(slugifyHeading("???")).toBe("section");
  });
});

describe("buildGuideAnchors", () => {
  it("keeps stored titles and order", () => {
    const anchors = buildGuideAnchors([section("What it does"), section("Set up")]);
    expect(anchors).toEqual([
      { id: "guide-what-it-does", title: "What it does" },
      { id: "guide-set-up", title: "Set up" },
    ]);
  });

  it("makes repeated and colliding titles unique", () => {
    const anchors = buildGuideAnchors([
      section("Set up"),
      section("Set up"),
      section("Set up 2"),
      section("Set up"),
    ]);
    const ids = anchors.map((anchor) => anchor.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("guide-set-up");
  });

  it("prefixes every id so titles cannot collide with the page's own ids", () => {
    const pageIds = ["main", "install-heading", "hooks-heading", "details-heading", "links-heading", "tags-heading"];
    const anchors = buildGuideAnchors([
      section("Main"),
      section("Install heading"),
      section("Hooks heading"),
      section("Details heading"),
    ]);
    expect(anchors.map((anchor) => anchor.id)).toEqual([
      "guide-main",
      "guide-install-heading",
      "guide-hooks-heading",
      "guide-details-heading",
    ]);
    for (const anchor of anchors) {
      expect(anchor.id.startsWith(GUIDE_ID_PREFIX)).toBe(true);
      expect(pageIds).not.toContain(anchor.id);
    }
  });

  it("handles duplicates and non-ASCII titles with unique, valid ids", () => {
    const anchors = buildGuideAnchors([
      section("Main"),
      section("Main"),
      section("Über uns"),
      section("日本語"),
      section("日本語"),
      section("Café setup"),
    ]);
    const ids = anchors.map((anchor) => anchor.id);
    expect(ids).toEqual([
      "guide-main",
      "guide-main-2",
      "guide-uber-uns",
      "guide-section",
      "guide-section-2",
      "guide-cafe-setup",
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^guide-[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(anchors.map((anchor) => anchor.title)).toEqual([
      "Main",
      "Main",
      "Über uns",
      "日本語",
      "日本語",
      "Café setup",
    ]);
  });

  it("returns an empty list for an empty guide", () => {
    expect(buildGuideAnchors([])).toEqual([]);
  });
});
