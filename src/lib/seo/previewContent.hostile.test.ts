// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { verifiedExtension } from "@/components/catalog/__fixtures__/extensions";
import type { Extension } from "@/lib/types";

const hostileEntries: readonly Extension[] = [
  { ...verifiedExtension, slug: "emoji-only", name: "\ud83d\ude80\ud83d\udd25", summary: "\ud83c\udf89 party \ud83c\udf89" },
  { ...verifiedExtension, slug: "cjk-only", name: "\u65e5\u672c\u8a9e\u30c4\u30fc\u30eb", summary: "\u4e2d\u6587\u63cf\u8ff0" },
  { ...verifiedExtension, slug: "rtl-only", name: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", summary: "\u05e9\u05dc\u05d5\u05dd \u05e2\u05d5\u05dc\u05dd" },
  { ...verifiedExtension, slug: "combining", name: "Z\u0356\u0357\u0358algo tool", summary: "e\u0301e\u0301e\u0301" },
  { ...verifiedExtension, slug: "unbroken", name: "x".repeat(64), summary: "y".repeat(150) },
  { ...verifiedExtension, slug: "markup", name: "<img src=x onerror=alert(1)>", summary: "</div><script>x</script>" },
];

vi.mock("@/lib/catalog", () => ({
  getAllExtensions: () => hostileEntries,
  getExtensionBySlug: (slug: string) => hostileEntries.find((entry) => entry.slug === slug),
}));

const { default: ExtensionImage } = await import("@/app/extensions/[slug]/opengraph-image");
const { default: ExtensionTwitterImage } = await import("@/app/extensions/[slug]/twitter-image");

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

async function renders(component: typeof ExtensionImage, slug: string): Promise<void> {
  const response = await component({ params: Promise.resolve({ slug }) });
  expect(response.status).toBe(200);
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect(Array.from(bytes.slice(0, 4))).toEqual(PNG_SIGNATURE);
  expect(new DataView(bytes.buffer, bytes.byteOffset).getUint32(16)).toBe(1200);
}

describe("entry image routes with hostile names", () => {
  it.each(hostileEntries.map((entry) => entry.slug))("%s renders a PNG and does not throw", async (slug) => {
    await renders(ExtensionImage, slug);
    await renders(ExtensionTwitterImage, slug);
  });

  it("answers 404 for a slug that is not in the catalog", async () => {
    const response = await ExtensionImage({ params: Promise.resolve({ slug: "nope" }) });
    expect(response.status).toBe(404);
  });
});
