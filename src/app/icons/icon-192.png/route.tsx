import { renderMarkIcon } from "@/lib/seo/shareImages";

// Static export needs route handlers marked static. Listed in the web app manifest.
export const dynamic = "force-static";

export function GET(): ReturnType<typeof renderMarkIcon> {
  return renderMarkIcon({ size: 192 });
}
