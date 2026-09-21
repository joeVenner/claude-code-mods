import type { Extension } from "@/lib/types";

/**
 * Extra rules for pull-request submissions in `src/data/community/`. Maintainer entries in
 * `catalog.json` are reviewed by hand and are not held to these, except the date rule.
 *
 * The rules exist because a listing renders copy-to-run commands, names a publisher and links to
 * source, and anyone can open a pull request. They are pure functions with no file access.
 */

const COMMUNITY_HOST = "github.com";
const CONTROL_OR_FORMAT_CHARACTER = /[\p{Cc}\p{Cf}]/u;
const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;
const MAX_MESSAGE_TEXT_LENGTH = 60;

export const MAX_COMMAND_LENGTH = 200;

/** Owners that only the real organizations may use, compared case-insensitively. */
export const RESERVED_OWNERS: readonly string[] = ["anthropics", "anthropic", "modelcontextprotocol", "claude-ai", "claude"];

/** Words a community publisher name may not contain, after normalisation. */
export const RESERVED_PUBLISHER_WORDS: readonly string[] = ["anthropic", "claude", "official", "mcp"];

export const COMMUNITY_LIMITS = {
  nameLength: 80,
  summaryLength: 160,
  publisherNameLength: 80,
  licenseLength: 200,
  paragraphLength: 1200,
  guideTitleLength: 80,
  guideSections: 12,
  tagLength: 40,
  tags: 12,
  hookLength: 80,
  hooks: 40,
  detailLabelLength: 60,
  detailValueLength: 300,
  linkLabelLength: 60,
  links: 10,
} as const;

/** Slugs this close (edit distance) to another slug are treated as look-alikes. */
const SLUG_LOOKALIKE_DISTANCE = 2;
const SLUG_LOOKALIKE_MIN_LENGTH = 6;

export interface CommunityRuleOptions {
  /** Slugs already taken by other entries, for the look-alike check. */
  readonly existingSlugs?: readonly string[];
}

/** Today as YYYY-MM-DD in UTC. Callers inject a fixed value in tests. */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Quotes text for an error message: cut to 60 characters, with control, bidi and zero-width
 * characters shown as escapes so a hostile value cannot rewrite the terminal or the log line.
 */
export function describeText(text: string): string {
  const characters = Array.from(text);
  const shown = characters.slice(0, MAX_MESSAGE_TEXT_LENGTH).map(escapeCharacter).join("");
  return `"${shown}${characters.length > MAX_MESSAGE_TEXT_LENGTH ? "..." : ""}"`;
}

function escapeCharacter(character: string): string {
  if (character === "\n") return "\\n";
  if (character === "\r") return "\\r";
  if (character === "\t") return "\\t";
  if (!CONTROL_OR_FORMAT_CHARACTER.test(character)) return character;
  const codePoint = character.codePointAt(0) ?? 0;
  return `\\u{${codePoint.toString(16)}}`;
}

/** Owner and repository of a github.com URL, lower-cased for comparison, or null for any other URL. */
export function githubOwnerAndRepo(url: string): { readonly owner: string; readonly repo: string } | null {
  if (!URL.canParse(url)) return null;
  const parsed = new URL(url);
  if (parsed.hostname !== COMMUNITY_HOST) return null;
  const [owner, rawRepo] = parsed.pathname.split("/").filter((segment) => segment !== "");
  if (owner === undefined) return null;
  const repo = (rawRepo ?? "").replace(/\.git$/i, "");
  return { owner: owner.toLowerCase(), repo: repo.toLowerCase() };
}

// ---------- copy-to-run commands ----------

// Names never start with a hyphen, so a value can never be read as a command-line flag.
const NAME = "[A-Za-z0-9._][A-Za-z0-9._-]*";
const MARKETPLACE_ADD = new RegExp(`^/plugin marketplace add ${NAME}/${NAME}$`);
const PLUGIN_INSTALL = new RegExp(`^/plugin install ${NAME}@${NAME}$`);
const PLUGIN_DIR = /^claude --plugin-dir [A-Za-z0-9._/][A-Za-z0-9._/-]*$/;
// Only the flags the mods guide uses to fetch a single folder are allowed on a clone.
const CLONE = new RegExp(
  `^git clone(?: --depth [0-9]{1,4}| --filter=blob:none| --sparse)* https://github\\.com/(${NAME})/(${NAME}?)(?:\\.git)?$`,
);
const CHANGE_DIRECTORY = new RegExp(`^cd (${NAME})$`);
const SPARSE_CHECKOUT = /^git sparse-checkout set((?: [A-Za-z0-9._/][A-Za-z0-9._/-]*)+)$/;

interface CommandContext {
  readonly owner: string;
  readonly repo: string;
  /** True when the same guide section holds an allowed clone of the entry's own repository. */
  readonly hasOwnClone: boolean;
}

function isOwnClone(command: string, owner: string, repo: string): boolean {
  const match = CLONE.exec(command);
  return match !== null && match[1].toLowerCase() === owner && match[2].toLowerCase() === repo;
}

/**
 * Returns why a command may not be shown as copy-to-run, or null when it is one of the allowed
 * shapes. Anything else must be written as prose with `isCommand` false.
 */
export function commandProblem(command: string, context: CommandContext): string | null {
  if (/[\r\n]/.test(command)) return "must be a single line";
  if (!PRINTABLE_ASCII.test(command)) return "must use printable ASCII only";
  if (command.length > MAX_COMMAND_LENGTH) return `must be at most ${MAX_COMMAND_LENGTH} characters`;
  if (MARKETPLACE_ADD.test(command) || PLUGIN_INSTALL.test(command) || PLUGIN_DIR.test(command)) return null;
  const clone = CLONE.exec(command);
  if (clone !== null) {
    const isOwn = clone[1].toLowerCase() === context.owner && clone[2].toLowerCase() === context.repo;
    return isOwn ? null : "git clone must use the entry's own repository (same owner and repo as repositoryUrl)";
  }
  if (context.hasOwnClone) {
    const changeDirectory = CHANGE_DIRECTORY.exec(command);
    if (changeDirectory !== null && changeDirectory[1].toLowerCase() === context.repo && ![".", ".."].includes(context.repo)) {
      return null;
    }
    const sparse = SPARSE_CHECKOUT.exec(command);
    const hasTraversal = sparse !== null && sparse[1].split(" ").some((part) => part.split("/").includes(".."));
    if (sparse !== null && !hasTraversal) return null;
  }
  return "is not an allowed command shape; write it as prose with isCommand false";
}

/** Problems with every copy-to-run field: installCommands, details with isCommand, guide commands. */
export function commandProblems(extension: Extension): readonly string[] {
  const repository = githubOwnerAndRepo(extension.repositoryUrl);
  const owner = repository?.owner ?? "";
  const repo = repository?.repo ?? "";
  const problems: string[] = [];
  const check = (fieldPath: string, command: string, hasOwnClone: boolean): void => {
    const problem = commandProblem(command, { owner, repo, hasOwnClone });
    if (problem !== null) problems.push(`${fieldPath}: ${describeText(command)} ${problem}`);
  };

  extension.installCommands.forEach((command, index) => check(`installCommands.${index}`, command, false));
  extension.details.forEach((detail, index) => {
    if (detail.isCommand) check(`details.${index}.value`, detail.value, false);
  });
  extension.guide.forEach((section, sectionIndex) => {
    const hasOwnClone = section.commands.some((command) => isOwnClone(command, owner, repo));
    section.commands.forEach((command, index) =>
      check(`guide.${sectionIndex}.commands.${index}`, command, hasOwnClone),
    );
  });
  return problems;
}

// ---------- text hygiene ----------

/** Finds control, bidi and zero-width characters (Unicode categories Cc and Cf) in any string value. */
export function invisibleCharacterProblems(value: unknown, fieldPath = ""): readonly string[] {
  if (typeof value === "string") {
    return CONTROL_OR_FORMAT_CHARACTER.test(value)
      ? [`${fieldPath || "(root)"}: contains a control, bidi or zero-width character in ${describeText(value)}`]
      : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => invisibleCharacterProblems(item, joinPath(fieldPath, String(index))));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => invisibleCharacterProblems(item, joinPath(fieldPath, key)));
  }
  return [];
}

function joinPath(base: string, key: string): string {
  return base === "" ? key : `${base}.${key}`;
}

function limitProblems(extension: Extension): readonly string[] {
  const limits = COMMUNITY_LIMITS;
  const problems: string[] = [];
  const longest = (fieldPath: string, text: string, max: number): void => {
    if (text.length > max) problems.push(`${fieldPath}: is ${text.length} characters, the limit is ${max}`);
  };
  const most = (fieldPath: string, count: number, max: number): void => {
    if (count > max) problems.push(`${fieldPath}: has ${count} items, the limit is ${max}`);
  };

  longest("name", extension.name, limits.nameLength);
  longest("summary", extension.summary, limits.summaryLength);
  longest("publisher.name", extension.publisher.name, limits.publisherNameLength);
  if (extension.license !== null) longest("license", extension.license, limits.licenseLength);
  extension.description.forEach((text, index) => longest(`description.${index}`, text, limits.paragraphLength));
  most("guide", extension.guide.length, limits.guideSections);
  extension.guide.forEach((section, sectionIndex) => {
    longest(`guide.${sectionIndex}.title`, section.title, limits.guideTitleLength);
    section.paragraphs.forEach((text, index) =>
      longest(`guide.${sectionIndex}.paragraphs.${index}`, text, limits.paragraphLength),
    );
  });
  most("tags", extension.tags.length, limits.tags);
  extension.tags.forEach((tag, index) => longest(`tags.${index}`, tag, limits.tagLength));
  most("hooks", extension.hooks.length, limits.hooks);
  extension.hooks.forEach((hook, index) => longest(`hooks.${index}`, hook, limits.hookLength));
  extension.details.forEach((detail, index) => {
    longest(`details.${index}.label`, detail.label, limits.detailLabelLength);
    longest(`details.${index}.value`, detail.value, limits.detailValueLength);
  });
  most("links", extension.links.length, limits.links);
  extension.links.forEach((link, index) => longest(`links.${index}.label`, link.label, limits.linkLabelLength));
  return problems;
}

// ---------- identity ----------

// NFKC folds full-width and ligature forms but not look-alikes from other scripts, so the common
// Cyrillic, Greek and Latin ones are listed by code point (so this file holds no look-alike text
// itself). This is a small list, not a full confusables table.
const LOOKALIKE_CODE_POINTS: readonly (readonly [number, string])[] = [
  [0x0430, "a"],
  [0x0435, "e"],
  [0x043e, "o"],
  [0x0440, "p"],
  [0x0441, "c"],
  [0x0443, "y"],
  [0x0445, "x"],
  [0x0456, "i"],
  [0x0458, "j"],
  [0x0455, "s"],
  [0x0501, "d"],
  [0x04cf, "l"],
  [0x0475, "v"],
  [0x043c, "m"],
  [0x0442, "t"],
  [0x043d, "h"],
  [0x03b1, "a"],
  [0x03bf, "o"],
  [0x03c1, "p"],
  [0x03b9, "i"],
  [0x03bd, "v"],
  [0x03ba, "k"],
  [0x03c5, "u"],
  [0x0131, "i"],
  [0x0251, "a"],
  [0x0261, "g"],
];
const LOOKALIKES: ReadonlyMap<string, string> = new Map(
  LOOKALIKE_CODE_POINTS.map(([codePoint, latin]) => [String.fromCodePoint(codePoint), latin]),
);

/** Lower-cased NFKC form with common look-alike letters replaced by their Latin twin. */
export function foldForComparison(text: string): string {
  return Array.from(text.normalize("NFKC").toLowerCase(), (character) => LOOKALIKES.get(character) ?? character).join("");
}

function publisherProblems(extension: Extension): readonly string[] {
  const problems: string[] = [];
  const repository = githubOwnerAndRepo(extension.repositoryUrl);
  if (repository !== null && RESERVED_OWNERS.includes(repository.owner)) {
    problems.push(`repositoryUrl: the owner "${repository.owner}" is reserved for the real organization`);
  }
  const foldedName = foldForComparison(extension.publisher.name);
  const reservedWord = RESERVED_PUBLISHER_WORDS.find((word) => foldedName.includes(word));
  if (reservedWord !== undefined) {
    problems.push(`publisher.name: ${describeText(extension.publisher.name)} contains the reserved word "${reservedWord}"`);
  }

  if (extension.publisher.url === null) {
    problems.push("publisher.url: is required for community entries and must be the publisher's github.com page");
    return problems;
  }
  const publisher = githubOwnerAndRepo(extension.publisher.url);
  const source = githubOwnerAndRepo(extension.verification.sourceUrl);
  if (publisher === null) {
    problems.push("publisher.url: must be on github.com");
  } else if (repository !== null && publisher.owner !== repository.owner) {
    problems.push(`publisher.url: owner "${publisher.owner}" must equal the repositoryUrl owner "${repository.owner}"`);
  }
  if (source === null) {
    problems.push("verification.sourceUrl: must be on github.com");
  } else if (repository !== null && source.owner !== repository.owner) {
    problems.push(
      `verification.sourceUrl: owner "${source.owner}" must equal the repositoryUrl owner "${repository.owner}"`,
    );
  }
  return problems;
}

/** Edit distance between two strings (insert, delete, substitute), two-row version. */
export function levenshteinDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + substitutionCost);
    }
    previous = current;
  }
  return previous[right.length];
}

/** Slugs near another entry's slug, which could pass for it in a list. Exact matches are reported elsewhere. */
export function lookalikeSlugProblems(slug: string, existingSlugs: readonly string[]): readonly string[] {
  if (slug.length < SLUG_LOOKALIKE_MIN_LENGTH) return [];
  return existingSlugs
    .filter((other) => other !== slug && other.length >= SLUG_LOOKALIKE_MIN_LENGTH)
    .filter((other) => levenshteinDistance(slug, other) <= SLUG_LOOKALIKE_DISTANCE)
    .map((other) => `slug: "${slug}" is within edit distance ${SLUG_LOOKALIKE_DISTANCE} of the existing slug "${other}"`);
}

// ---------- dates ----------

/** Problem when the verification date is later than `today` (both YYYY-MM-DD, so string order is date order). */
export function futureCheckedAtProblem(extension: Extension, today: string): string | null {
  const { checkedAt } = extension.verification;
  return checkedAt > today
    ? `verification.checkedAt: ${checkedAt} is later than today (${today}, UTC)`
    : null;
}

// ---------- entry point ----------

/**
 * Lists the problems found in a community submission, or an empty list when it follows every rule.
 * `fileName` is the base name of the file the entry was read from.
 */
export function communityRuleProblems(
  extension: Extension,
  fileName: string,
  options: CommunityRuleOptions = {},
): readonly string[] {
  const problems: string[] = [];
  const expectedFileName = `${extension.slug}.json`;
  if (fileName !== expectedFileName) {
    problems.push(`file name must be "${expectedFileName}" to match the slug "${extension.slug}"`);
  }
  if (extension.publisher.kind !== "community") {
    problems.push(`publisher.kind must be "community", found "${extension.publisher.kind}"`);
  }
  if (extension.isFeatured) {
    problems.push("isFeatured must be false: only maintainers feature entries");
  }
  if (extension.stars !== null) {
    problems.push("stars must be null: submitters cannot claim stars");
  }
  if (extension.availability === "built-in") {
    problems.push('availability must not be "built-in": only maintainers list what ships inside Claude Code');
  }
  if (githubOwnerAndRepo(extension.repositoryUrl) === null) {
    problems.push(`repositoryUrl must be on ${COMMUNITY_HOST}`);
  }
  problems.push(
    ...invisibleCharacterProblems(extension),
    ...limitProblems(extension),
    ...publisherProblems(extension),
    ...commandProblems(extension),
    ...lookalikeSlugProblems(extension.slug, options.existingSlugs ?? []),
  );
  return problems;
}
