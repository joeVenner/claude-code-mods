import { getIdeas } from "@/lib/ideas";
import { buildIdeasPreviewContent, PREVIEW_IMAGE_CONTENT_TYPE, PREVIEW_IMAGE_SIZE } from "@/lib/seo/previewContent";
import { renderPreviewBanner } from "@/lib/seo/shareImages";

// Required for `output: "export"`: rendered once at build time.
export const dynamic = "force-static";

export const alt = "Proposed Claude Code mod ideas that have no public implementation";
export const size = PREVIEW_IMAGE_SIZE;
export const contentType = PREVIEW_IMAGE_CONTENT_TYPE;

export default function Image(): ReturnType<typeof renderPreviewBanner> {
  return renderPreviewBanner(buildIdeasPreviewContent(getIdeas().length));
}
