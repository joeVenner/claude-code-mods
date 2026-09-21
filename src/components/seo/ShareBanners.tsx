import type { CSSProperties, ReactNode } from "react";
import { BRAND_COLORS } from "@/lib/seo/brandMark";
import { BRAND_FONT_FAMILY, BRAND_MONO_FONT_FAMILY } from "@/lib/seo/fonts";
import {
  PREVIEW_HOST,
  PREVIEW_IMAGE_SIZE,
  previewTitleFontSize,
  type PreviewContent,
} from "@/lib/seo/previewContent";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { BrandMark } from "@/components/seo/BrandMark";

/**
 * Layouts for the 1200x630 share images. They run inside `ImageResponse` (Satori), which supports
 * flexbox and inline styles only, so this file uses no class names. Every dynamic value is placed
 * as a text child: nothing here builds markup from catalog text.
 */

const PADDING = 72;
const UNOFFICIAL_NOTE = "Unofficial community directory";

const frameStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: PREVIEW_IMAGE_SIZE.width,
  height: PREVIEW_IMAGE_SIZE.height,
  padding: PADDING,
  backgroundColor: BRAND_COLORS.background,
  color: BRAND_COLORS.foreground,
  fontFamily: BRAND_FONT_FAMILY,
  position: "relative",
};

const footerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  // Fixed height so the hairline sits at the same place on every image, with or without tags.
  height: 96,
  borderTop: `1px solid ${BRAND_COLORS.border}`,
  fontFamily: BRAND_MONO_FONT_FAMILY,
  fontSize: 26,
  color: BRAND_COLORS.muted,
};

/**
 * Wraps text word by word, using a flex gap as the space. Satori measures Geist words that contain
 * kerning pairs wider than it draws them, which shows as uneven gaps inside a line; separate words
 * limit that to the gap. Long running text uses Geist Mono, which has no kerning, instead.
 * The words are still plain text children.
 */
function WordFlow({ text, fontSize, style }: { readonly text: string; readonly fontSize: number; readonly style: CSSProperties }): ReactNode {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: fontSize * 0.26, fontSize, maxWidth: PREVIEW_IMAGE_SIZE.width - PADDING * 2, ...style }}>
      {text.split(" ").map((word, index) => (
        // break-all lets an unbroken 64 character name wrap onto a second line instead of running off the image.
        <div key={`${index}-${word}`} style={{ display: "flex", maxWidth: "100%", wordBreak: "break-all" }}>
          {word}
        </div>
      ))}
    </div>
  );
}

/** The mark beside the wordmark. */
function Wordmark({ markSize, textSize }: { readonly markSize: number; readonly textSize: number }): ReactNode {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: markSize * 0.28 }}>
      <BrandMark size={markSize} />
      <div style={{ fontSize: textSize, fontWeight: 600, letterSpacing: "-0.02em", color: BRAND_COLORS.foreground }}>{SITE_NAME}</div>
    </div>
  );
}

/** A large, faint copy of the mark bleeding off the right edge: the banner's one decorative element. */
function GhostMark(): ReactNode {
  return (
    <div style={{ display: "flex", position: "absolute", right: -40, top: 60 }}>
      <BrandMark size={520} opacity={0.07} />
    </div>
  );
}

function Prompt({ children }: { readonly children: string }): ReactNode {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ color: BRAND_COLORS.accent }}>$</div>
      <div>{children}</div>
    </div>
  );
}

/** Site-wide banner: wordmark, tagline and the unofficial note. */
export function SiteBanner(): ReactNode {
  return (
    <div style={frameStyle}>
      <GhostMark />
      <Wordmark markSize={76} textSize={40} />
      <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
        <WordFlow
          text={SITE_TAGLINE}
          fontSize={66}
          style={{ maxWidth: 900, fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.035em" }}
        />
      </div>
      <div style={footerStyle}>
        <Prompt>{UNOFFICIAL_NOTE}</Prompt>
        <div style={{ display: "flex" }}>{PREVIEW_HOST}</div>
      </div>
    </div>
  );
}

function Tag({ label, isAccent }: { readonly label: string; readonly isAccent: boolean }): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        padding: "6px 16px",
        borderRadius: 6,
        border: `1px solid ${isAccent ? BRAND_COLORS.accent : BRAND_COLORS.borderStrong}`,
        color: isAccent ? BRAND_COLORS.accent : BRAND_COLORS.foreground,
        fontFamily: BRAND_MONO_FONT_FAMILY,
        fontSize: 24,
      }}
    >
      {label}
    </div>
  );
}

/** Banner for one entry or page: kind label, title, summary, byline and tags. */
export function PreviewBanner({ content }: { readonly content: PreviewContent }): ReactNode {
  return (
    <div style={frameStyle}>
      <GhostMark />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark markSize={48} textSize={28} />
        <Tag label={content.eyebrow} isAccent />
      </div>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <WordFlow
          text={content.title}
          fontSize={previewTitleFontSize(content.title.length)}
          style={{ fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.035em" }}
        />
        <div
          style={{
            maxWidth: 1000,
            maxHeight: 130,
            overflow: "hidden",
            wordBreak: "break-all",
            fontFamily: BRAND_MONO_FONT_FAMILY,
            fontSize: 28,
            lineHeight: 1.5,
            color: BRAND_COLORS.muted,
          }}
        >
          {content.summary}
        </div>
      </div>
      <div style={footerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {content.byline === "" ? null : <div style={{ display: "flex", color: BRAND_COLORS.foreground }}>{content.byline}</div>}
          {content.tags.map((tag) => (
            <Tag key={tag} label={tag} isAccent={false} />
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 22 }}>{UNOFFICIAL_NOTE}</div>
      </div>
    </div>
  );
}
