import { describe, expect, it } from "vitest";
import { searchExtensions } from "@/lib/search";
import { builtInModExtension, sourceOnlyExtension, verifiedExtension } from "./__fixtures__/extensions";
import { searchListItems, toListItem, toListItems } from "./ExtensionListItem";

const LIST_FIELDS = [
  "availability",
  "categories",
  "hooks",
  "isFeatured",
  "kind",
  "name",
  "publisher",
  "slug",
  "stars",
  "summary",
  "tags",
  "verification",
];

describe("toListItem", () => {
  it("keeps exactly the fields the list views read", () => {
    expect(Object.keys(toListItem(builtInModExtension)).sort()).toEqual(LIST_FIELDS);
  });

  it("drops long-form data so it never reaches client props", () => {
    const item = toListItem(builtInModExtension) as Record<string, unknown>;
    for (const field of ["guide", "description", "details", "notice", "links", "installCommands", "license"]) {
      expect(item).not.toHaveProperty(field);
    }
    expect(JSON.stringify(item)).not.toContain("Fixture setup paragraph.");
    expect(JSON.stringify(item)).not.toContain("Fixture mod paragraph one.");
  });

  it("keeps values unchanged", () => {
    const item = toListItem(verifiedExtension);
    expect(item.slug).toBe(verifiedExtension.slug);
    expect(item.stars).toEqual(verifiedExtension.stars);
    expect(item.publisher.kind).toBe("community");
  });

  it("maps lists in order", () => {
    const items = toListItems([verifiedExtension, sourceOnlyExtension]);
    expect(items.map((item) => item.slug)).toEqual([verifiedExtension.slug, sourceOnlyExtension.slug]);
  });
});

describe("searchListItems", () => {
  const all = [verifiedExtension, builtInModExtension, sourceOnlyExtension];
  const items = toListItems(all);

  it("returns the same entries in the same order as searchExtensions for every filter shape", () => {
    const shapes = [
      {},
      { query: "lint" },
      { query: "classic" },
      { kind: "mod" as const },
      { availability: "source-only" as const },
      { category: "development" as const, query: "fixture" },
    ];
    for (const filters of shapes) {
      expect(searchListItems(items, filters).map((item) => item.slug)).toEqual(
        searchExtensions(all, filters).map((entry) => entry.slug),
      );
    }
  });

  it("returns the list items it was given, not copies", () => {
    expect(searchListItems(items, { kind: "skill" })[0]).toBe(items[2]);
  });
});
