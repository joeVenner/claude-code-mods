export const SITE_NAME = "Claude Code Mods";

/** Plain and concrete on purpose; also used as the wordmark's accessible description. */
export const SITE_TAGLINE = "Community directory of Claude Code mods, plugins, skills, agents, and MCP servers.";

export const SITE_DESCRIPTION =
  "Browse Claude Code mods, plugins, skills, agents, hooks, and MCP servers. Each entry shows the date its source URL last responded.";

export const DISCLAIMER = "Unofficial community directory. Not affiliated with or endorsed by Anthropic.";

/** Shown wherever the "Source verified" badge could be misread as a security claim. */
export const VERIFICATION_NOTE =
  "Source verified means the source URL responded. It is not a security review.";

/** Public repository that accepts community submissions by pull request. */
export const COMMUNITY_REPOSITORY_URL = "https://github.com/joeVenner/claude-code-mods";

const LOCAL_SITE_URL = "http://localhost:3000";
/** Where the site is deployed. Production builds fall back to it so canonical URLs never say localhost. */
export const PRODUCTION_SITE_URL = "https://claudecodemods.com";

/**
 * Normalises a configured site URL to an origin-style string without a trailing slash.
 * Missing or malformed values fall back to the production domain in production builds and to
 * localhost otherwise, so a bad env var can neither break `metadataBase` nor leak localhost
 * into the sitemap and canonical tags of a deployed site.
 */
export function resolveSiteUrl(
  rawUrl: string | undefined,
  isProduction: boolean = process.env.NODE_ENV === "production",
): string {
  const fallback = isProduction ? PRODUCTION_SITE_URL : LOCAL_SITE_URL;
  if (!rawUrl) return fallback;
  try {
    const parsed = new URL(rawUrl);
    // Plain http is for local development only: a production build must never publish http canonical URLs.
    const isAllowedProtocol = parsed.protocol === "https:" || (parsed.protocol === "http:" && !isProduction);
    if (!isAllowedProtocol) return fallback;
    return parsed.origin;
  } catch {
    return fallback;
  }
}

export const SITE_URL: string = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export interface NavLink {
  readonly label: string;
  /** Internal path with trailing slash (the site exports with `trailingSlash: true`). */
  readonly href: string;
  /** Extra path prefixes that should also mark this link as the current section. */
  readonly matchPrefixes?: readonly string[];
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Browse", href: "/browse/", matchPrefixes: ["/extensions/"] },
  { label: "Learn", href: "/learn/" },
  { label: "Hooks", href: "/hooks/" },
  { label: "Ideas", href: "/ideas/" },
  { label: "Security", href: "/security/" },
  { label: "Publish", href: "/publish/" },
  { label: "About", href: "/about/" },
];

/** True when `pathname` belongs to the section a nav link represents. */
export function isNavLinkActive(pathname: string, link: NavLink): boolean {
  const normalizedPathname = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return [link.href, ...(link.matchPrefixes ?? [])].some((prefix) => normalizedPathname.startsWith(prefix));
}

/**
 * Stacking scale. Only systemic layers get a z-index; everything else stays in flow.
 * Order: header < menu < overlay < skipLink (the skip link must beat everything when focused).
 */
export const Z_INDEX = {
  header: 40,
  menu: 50,
  overlay: 60,
  skipLink: 100,
} as const;

/** Literal class names so Tailwind's scanner sees them; keep in sync with `Z_INDEX`. */
export const Z_CLASS = {
  header: "z-40",
  menu: "z-50",
  overlay: "z-60",
  skipLink: "z-100",
} as const;
