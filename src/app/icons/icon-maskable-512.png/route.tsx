import { renderMarkIcon } from "@/lib/seo/shareImages";

// Full bleed with the prompt scaled into the central 80% "safe zone" that platforms crop to.
export const dynamic = "force-static";

export function GET(): ReturnType<typeof renderMarkIcon> {
  return renderMarkIcon({ size: 512, isRounded: false, glyphScale: 0.85 });
}
