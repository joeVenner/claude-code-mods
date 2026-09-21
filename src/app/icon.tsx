import { renderMarkIcon } from "@/lib/seo/shareImages";

// Required for `output: "export"`: rendered once at build time.
export const dynamic = "force-static";

// Browser tab icon. `favicon.ico` next to it covers 16 and 48 px and older browsers.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon(): ReturnType<typeof renderMarkIcon> {
  return renderMarkIcon({ size: size.width });
}
