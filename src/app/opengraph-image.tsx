import { PREVIEW_IMAGE_CONTENT_TYPE, PREVIEW_IMAGE_SIZE, SITE_BANNER_ALT } from "@/lib/seo/previewContent";
import { renderSiteBanner } from "@/lib/seo/shareImages";

// Required for `output: "export"`: rendered once at build time.
export const dynamic = "force-static";

export const alt = SITE_BANNER_ALT;
export const size = PREVIEW_IMAGE_SIZE;
export const contentType = PREVIEW_IMAGE_CONTENT_TYPE;

export default function Image(): ReturnType<typeof renderSiteBanner> {
  return renderSiteBanner();
}
