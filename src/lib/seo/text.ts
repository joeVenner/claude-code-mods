/**
 * Text helpers for everything generated for machines and previews (metadata, llms files, the feed,
 * share images). Catalog text can come from community pull requests, so it is normalised here
 * before it is placed in any output.
 */

const EN_DASH = "\u2013";
const EM_DASH = "\u2014";
// Spaces and tabs only: `\s` would also swallow the newlines around a dash and merge two lines.
const DASH_PATTERN = new RegExp(`[ \\t]*[${EN_DASH}${EM_DASH}][ \\t]*`, "g");
// C0 controls except tab and newline, DEL and C1 controls: never valid in XML or useful in a preview.
const CONTROL_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const NONCHARACTER_PATTERN = /\p{Noncharacter_Code_Point}/gu;
const ELLIPSIS = "\u2026";

/**
 * Replaces en and em dashes with a spaced hyphen (the site's copy rule allows hyphens, commas,
 * colons and periods, not long dashes) and removes control characters, noncharacters and lone
 * surrogates, so the result is valid XML. Newlines are kept.
 */
export function toPlainText(value: string): string {
  // toWellFormed turns a lone surrogate into U+FFFD, which is a valid XML character. Noncharacters
  // (U+FFFE, U+FFFF, U+FDD0 to U+FDEF and the last two code points of each plane) are removed:
  // they are not allowed in XML documents.
  return value
    .toWellFormed()
    .replace(CONTROL_PATTERN, "")
    .replace(NONCHARACTER_PATTERN, "")
    .replace(DASH_PATTERN, " - ");
}

/** `toPlainText` plus whitespace collapsed to single spaces, for one-line contexts. */
export function toSingleLine(value: string): string {
  return toPlainText(value).replace(/\s+/g, " ").trim();
}

/**
 * Cuts `value` to at most `maxLength` characters on a word boundary and ends it with an ellipsis.
 * Text that already fits is returned unchanged, so callers can clamp unconditionally.
 */
export function clampText(value: string, maxLength: number): string {
  const text = toSingleLine(value);
  // Work on code points, not UTF-16 units, so a cut can never split a surrogate pair.
  const characters = Array.from(text);
  if (characters.length <= maxLength) return text;
  const room = maxLength - 1;
  if (room < 1) return ELLIPSIS;
  const slice = characters.slice(0, room).join("");
  const lastSpace = slice.lastIndexOf(" ");
  const isWordBoundaryUseful = lastSpace >= room * 0.6;
  const cut = (isWordBoundaryUseful ? slice.slice(0, lastSpace) : slice).replace(/[\s,.:;]+$/, "");
  return `${cut}${ELLIPSIS}`;
}

/** Lower-cases a label's first letter unless it starts an acronym ("MCP server" stays as written). */
export function lowerCaseLabel(label: string): string {
  const second = label.charAt(1);
  const isAcronym = second !== "" && second === second.toUpperCase() && second !== second.toLowerCase();
  return isAcronym ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

/** "a" or "an" for a label as it is spoken ("an MCP server", "an agent", "a mod"). */
export function indefiniteArticle(label: string): "a" | "an" {
  return /^(?:[aeiou]|mcp\b)/i.test(label) ? "an" : "a";
}

/** Adds a final period unless the text already ends in sentence punctuation. */
export function withFinalPeriod(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

// A line that starts with one of these would be read as a heading, quote, list item, table row,
// link definition or code fence in Markdown. `\d+[.)]` is an ordered list marker.
const LEADING_MARKDOWN = /^(\s*)(#|>|-|\+|\*|\[|\||`|~|=)/;
const LEADING_ORDERED_LIST = /^(\s*\d+)([.)])/;
const MARKDOWN_SPECIALS = /([\\[\]<>`])/g;

/**
 * One line of untrusted text made safe to place at the start of a Markdown line: whitespace is
 * collapsed (so a paragraph can never contain a newline followed by a forged heading) and a
 * leading marker character is escaped with a backslash (`\## title`, `1\. item`), which Markdown
 * shows as the plain character.
 */
export function toInertLine(value: string): string {
  const line = toSingleLine(value);
  return line.replace(LEADING_MARKDOWN, "$1\\$2").replace(LEADING_ORDERED_LIST, "$1\\$2");
}

/**
 * `toInertLine` plus backslash-escaped brackets, angle brackets, backticks and backslashes, so the
 * text cannot form a link, an autolink, inline code or an HTML tag. Used for third-party text that
 * is written into llms files, where AI systems read it.
 */
export function toStrictInertLine(value: string): string {
  return toInertLine(value.replace(MARKDOWN_SPECIALS, "\\$1"));
}
