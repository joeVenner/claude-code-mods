import { describe, expect, it } from "vitest";
import { extensionSchema } from "@/lib/types";
import { ENTRY_FIELD_DOCS, ENTRY_FIELD_GROUPS, EXAMPLE_ENTRY, EXAMPLE_ENTRY_JSON } from "./publishContent";

describe("publish content", () => {
  it("documents exactly the fields of the extension schema", () => {
    expect(Object.keys(ENTRY_FIELD_DOCS).sort()).toEqual(Object.keys(extensionSchema.shape).sort());
  });

  it("places every field in exactly one group", () => {
    const grouped = ENTRY_FIELD_GROUPS.flatMap((group) => group.fields);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(Object.keys(ENTRY_FIELD_DOCS).sort());
  });

  it("gives every field a non-empty type and description", () => {
    for (const doc of Object.values(ENTRY_FIELD_DOCS)) {
      expect(doc.type.length).toBeGreaterThan(0);
      expect(doc.description.length).toBeGreaterThan(0);
    }
  });

  it("keeps the example entry valid against the real schema and clearly fictional", () => {
    expect(extensionSchema.safeParse(EXAMPLE_ENTRY).success).toBe(true);
    expect(EXAMPLE_ENTRY.slug).toBe("example-hook-pack");
    expect(EXAMPLE_ENTRY.stars).toBeNull();
    expect(JSON.parse(EXAMPLE_ENTRY_JSON)).toEqual(EXAMPLE_ENTRY);
  });
});
