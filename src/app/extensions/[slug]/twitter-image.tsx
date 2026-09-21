import { getAllExtensions, getExtensionBySlug } from "@/lib/catalog";
import { buildEntryPreviewContent, PREVIEW_IMAGE_CONTENT_TYPE, PREVIEW_IMAGE_SIZE } from "@/lib/seo/previewContent";
import { renderPreviewWithFallback } from "@/lib/seo/shareImages";

// Required for `output: "export"`: rendered once at build time.
export const dynamic = "force-static";

// Only slugs from the catalog exist in a static export.
export const dynamicParams = false;

export const alt = "Claude Code Mods directory listing";
export const size = PREVIEW_IMAGE_SIZE;
export const contentType = PREVIEW_IMAGE_CONTENT_TYPE;

interface ImageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return getAllExtensions().map((extension) => ({ slug: extension.slug }));
}

export default async function Image({ params }: ImageProps): Promise<Response> {
  const { slug } = await params;
  const extension = getExtensionBySlug(slug);
  if (extension === undefined) return new Response("Not found", { status: 404 });
  return renderPreviewWithFallback(buildEntryPreviewContent(extension));
}
