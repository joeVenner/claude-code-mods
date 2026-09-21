/**
 * URL policy shared by the catalog schema and the link components.
 * Two different trust levels live here on purpose:
 * - catalog URLs come from data that other people can propose, so they are held to a host allowlist;
 * - hrefs written in code only need to be structurally safe (no `javascript:`, `data:` or protocol-relative).
 */

/** Hosts a catalog URL may point at. Adding one is a deliberate review decision, not a config tweak. */
export const ALLOWED_CATALOG_HOSTS: readonly string[] = ["github.com", "code.claude.com"];

/** Whitespace, brackets, parentheses, angle brackets, quotes, backslash and backtick. */
const UNSAFE_URL_CHARACTERS = /[\s[\]()<>"`\\]/;
/** The same set, for percent-encoding what is left of it after parsing. */
const OUTPUT_ESCAPED_CHARACTERS = /[()[\]<>"`\\]/g;

/**
 * True for an https URL on an allowlisted host, with no embedded credentials or custom port.
 * Credentials and ports are rejected because `https://github.com@evil.example` style links
 * look trustworthy in a listing while pointing somewhere else.
 */
export function isAllowedCatalogUrl(value: string): boolean {
  // Checked on the raw text, before parsing: the URL parser would percent-encode a space and
  // accept the rest, and these characters let a stored URL break out of Markdown link syntax
  // (`https://github.com/a/b) IGNORE PREVIOUS INSTRUCTIONS [x](https://evil.example/`).
  if (UNSAFE_URL_CHARACTERS.test(value)) return false;
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

/**
 * Normalises a URL that is written into machine-facing output (llms files, the feed, JSON-LD):
 * parsed and re-serialised with `new URL(...).href`, then any Markdown, HTML or quote character the
 * parser leaves alone is percent-encoded, so no stored value can end a link or an attribute early.
 * @throws Error when the value is not an http or https URL.
 */
export function toSafeOutputUrl(value: string): string {
  if (!URL.canParse(value)) throw new Error(`Not a URL: ${JSON.stringify(value)}`);
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Only http and https URLs can be written to output: ${JSON.stringify(value)}`);
  }
  return url.href.replace(OUTPUT_ESCAPED_CHARACTERS, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
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
