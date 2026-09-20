/**
 * URL policy shared by the catalog schema and the link components.
 * Two different trust levels live here on purpose:
 * - catalog URLs come from data that other people can propose, so they are held to a host allowlist;
 * - hrefs written in code only need to be structurally safe (no `javascript:`, `data:` or protocol-relative).
 */

/** Hosts a catalog URL may point at. Adding one is a deliberate review decision, not a config tweak. */
export const ALLOWED_CATALOG_HOSTS: readonly string[] = ["github.com", "code.claude.com"];

/**
 * True for an https URL on an allowlisted host, with no embedded credentials or custom port.
 * Credentials and ports are rejected because `https://github.com@evil.example` style links
 * look trustworthy in a listing while pointing somewhere else.
 */
export function isAllowedCatalogUrl(value: string): boolean {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    url.username === "" &&
    url.password === "" &&
    url.port === "" &&
    ALLOWED_CATALOG_HOSTS.includes(url.hostname)
  );
}

export type HrefKind = "internal" | "anchor" | "external" | "unsafe";

/**
 * Classifies an href written in code. `unsafe` covers every other scheme, protocol-relative
 * URLs (`//host`), backslash tricks and relative paths, so callers can fail fast on them.
 */
export function classifyHref(href: string): HrefKind {
  if (href.startsWith("#")) return "anchor";
  if (href.startsWith("/")) {
    const isProtocolRelative = href.startsWith("//") || href.startsWith("/\\");
    return isProtocolRelative ? "unsafe" : "internal";
  }
  if (!URL.canParse(href)) return "unsafe";
  const url = new URL(href);
  const isPlainHttps = url.protocol === "https:" && url.username === "" && url.password === "";
  return isPlainHttps ? "external" : "unsafe";
}

/** Returns the href unchanged when safe, otherwise throws so a bad link fails the build. */
export function assertSafeHref(href: string): string {
  if (classifyHref(href) === "unsafe") {
    throw new Error(`Unsafe href rejected: ${JSON.stringify(href)}`);
  }
  return href;
}
