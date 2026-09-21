import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { BrandMark } from "@/components/seo/BrandMark";
import { PreviewBanner, SiteBanner } from "@/components/seo/ShareBanners";
import { BRAND_COLORS } from "@/lib/seo/brandMark";
import { loadBrandFonts } from "@/lib/seo/fonts";
import { PREVIEW_IMAGE_CONTENT_TYPE, PREVIEW_IMAGE_SIZE, type PreviewContent } from "@/lib/seo/previewContent";

/**
 * `ImageResponse` renderers shared by the `opengraph-image`, `twitter-image`, icon and manifest
 * routes, so each route file stays a few lines and every image uses the same fonts and mark.
 */

export function renderSiteBanner(): Promise<ImageResponse> {
  return renderBanner(<SiteBanner />);
}

export function renderPreviewBanner(content: PreviewContent): Promise<ImageResponse> {
  return renderBanner(<PreviewBanner content={content} />);
}

/**
 * ImageResponse renders lazily: a failure (a font or emoji fetch, an unsupported node) surfaces
 * while the body is read, not when the object is built. Reading it here makes failures catchable.
 */
async function toPngResponse(image: ImageResponse): Promise<Response> {
  const bytes = await image.arrayBuffer();
  return new Response(bytes, { headers: { "Content-Type": PREVIEW_IMAGE_CONTENT_TYPE } });
}

/**
 * The preview banner for one entry, or the site banner when it cannot be rendered. Catalog text
 * is untrusted, so one odd entry must not fail the whole build. The failure is logged, not hidden.
 */
export async function renderPreviewWithFallback(
  content: PreviewContent,
  renderPrimary: (content: PreviewContent) => Promise<ImageResponse> = renderPreviewBanner,
): Promise<Response> {
  try {
    return await toPngResponse(await renderPrimary(content));
  } catch (error) {
    console.error(`Preview banner for "${content.title}" failed, using the site banner instead.`, error);
    return toPngResponse(await renderSiteBanner());
  }
}

async function renderBanner(element: ReactElement): Promise<ImageResponse> {
  const fonts = await loadBrandFonts();
  return new ImageResponse(element, { ...PREVIEW_IMAGE_SIZE, fonts: [...fonts] });
}

export interface MarkIconOptions {
  readonly size: number;
  /** False for a full-bleed square (maskable icons). */
  readonly isRounded?: boolean;
  readonly glyphScale?: number;
}

/** A square icon: the mark alone. Full-bleed icons get an accent background so nothing is transparent. */
export function renderMarkIcon({ size, isRounded = true, glyphScale = 1 }: MarkIconOptions): ImageResponse {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: size, height: size, backgroundColor: isRounded ? "transparent" : BRAND_COLORS.accent }}>
        <BrandMark size={size} isRounded={isRounded} glyphScale={glyphScale} />
      </div>
    ),
    { width: size, height: size },
  );
}
