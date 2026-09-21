// @vitest-environment node
import { describe, expect, it } from "vitest";
import { verifiedExtension } from "@/components/catalog/__fixtures__/extensions";
import { buildEntryPreviewContent } from "./previewContent";
import { vi } from "vitest";
import { renderMarkIcon, renderPreviewBanner, renderPreviewWithFallback, renderSiteBanner } from "./shareImages";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

async function pngOf(response: Response): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const bytes = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { bytes, width: view.getUint32(16), height: view.getUint32(20) };
}

describe("share image renderers", () => {
  it("renders the site banner as a 1200 by 630 PNG", async () => {
    const response = await renderSiteBanner();
    expect(response.headers.get("content-type")).toBe("image/png");
    const { bytes, width, height } = await pngOf(response);
    expect(Array.from(bytes.slice(0, 8))).toEqual(PNG_SIGNATURE);
    expect([width, height]).toEqual([1200, 630]);
  });

  it("renders an entry banner from hostile text without throwing", async () => {
    const hostile = { ...verifiedExtension, name: "<img src=x onerror=alert(1)>", summary: "</div><script>x</script> & more" };
    const { width, height } = await pngOf(await renderPreviewBanner(buildEntryPreviewContent(hostile)));
    expect([width, height]).toEqual([1200, 630]);
  });

  it("renders square icons at the requested size, rounded or full bleed", async () => {
    for (const options of [{ size: 32 }, { size: 180, isRounded: false, glyphScale: 0.9 }]) {
      const { width, height } = await pngOf(renderMarkIcon(options));
      expect([width, height]).toEqual([options.size, options.size]);
    }
  });

  it("falls back to the site banner, and logs, when the entry banner cannot be rendered", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const failing = (): Promise<never> => Promise.reject(new Error("font fetch failed"));
    const response = await renderPreviewWithFallback(buildEntryPreviewContent(verifiedExtension), failing);
    const { bytes, width, height } = await pngOf(response);
    expect(Array.from(bytes.slice(0, 8))).toEqual(PNG_SIGNATURE);
    expect([width, height]).toEqual([1200, 630]);
    expect(logged).toHaveBeenCalledOnce();
    logged.mockRestore();
  });
});
