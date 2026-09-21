import { renderMarkIcon } from "@/lib/seo/shareImages";

// Required for `output: "export"`: rendered once at build time.
export const dynamic = "force-static";

// iOS rounds the corners itself and paints transparent pixels black, so the icon is full bleed.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon(): ReturnType<typeof renderMarkIcon> {
  return renderMarkIcon({ size: size.width, isRounded: false, glyphScale: 0.9 });
}
