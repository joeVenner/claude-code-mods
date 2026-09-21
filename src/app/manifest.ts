import type { MetadataRoute } from "next";
import { BRAND_COLORS } from "@/lib/seo/brandMark";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Required for `output: "export"`: rendered once at build time.
export const dynamic = "force-static";

/** Short enough to sit under a home screen icon. */
const SHORT_NAME = "Code Mods";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SHORT_NAME,
    description: SITE_DESCRIPTION,
    lang: "en",
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLORS.background,
    theme_color: BRAND_COLORS.background,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
