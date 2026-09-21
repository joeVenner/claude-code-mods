// Pure helpers for scripts/sync-events.mjs. No network and no fs here, so vitest can import this file
// directly (src/lib/dts-events.test.ts).
//
// They read Claude Code's function-hooks type declarations (mods/types/claude-code.d.ts) and keep
// only event names, the family each belongs to and the line it is declared on. Nothing else from
// the declarations is copied: the file is published under "All rights reserved" terms, so this site
// links to it at a pinned commit instead of reproducing its comments or signatures.

export const EVENT_FAMILIES = ["engine", "op", "classic"];
export const UPSTREAM_REPOSITORY = "anthropics/claude-code";
export const DECLARATIONS_PATH = "mods/types/claude-code.d.ts";

// The d.ts keeps the two object types at two-space indent and their keys four spaces deeper.
// A key looks like:      'tool.call': ToolCallInput;
const KEY_INDENT_STEP = 4;
// Every pattern below reads text we do not control, so each one is anchored and length bounded.
// A quoted key at the key indent is an event. Any such key that is not shaped <noun>.<Name> stops the
// run, so a new naming style is noticed instead of being dropped from the list.
const QUOTED_KEY = /^'([^']{1,200})'\??\s*:/;
const EVENT_NAME = /^[a-z]{1,32}\.[A-Za-z]{1,64}$/;
const HOOK_EVENT_NAME = /^\s*hook_event_name: '([A-Za-z]{1,64})';?\s*$/;
// Most a member declaration may span before we stop looking for its hook_event_name.
const CLASSIC_DECLARATION_WINDOW = 80;
const VERSION_LINE = /^\/\/ Written by Claude Code (\d{1,4}\.\d{1,4}\.\d{1,6})\./;
const VERSION_SEARCH_LINES = 5;
const HOOK_INPUT_PREFIX = /^\s*(?:export\s+)?type HookInput = /;
const DECLARATION = /^\s*(?:export\s+)?(?:type|interface)\s+([A-Za-z_$][A-Za-z0-9_$]*)/;
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/;
// Far above the 33 classic hooks today; a longer union means the file is not what we expect to read.
const MAX_CLASSIC_MEMBERS = 200;

function indentOf(line) {
  return line.length - line.trimStart().length;
}

/**
 * Finds the one line that declares `typeName`, as `type X = {` or `export type X = {`.
 * @param {readonly string[]} lines
 * @param {string} typeName
 * @returns {number} zero-based line index
 */
function findObjectTypeStart(lines, typeName) {
  const declaration = new RegExp(`^\\s*(?:export\\s+)?type ${typeName} = \\{\\s*$`);
  const matches = lines.flatMap((line, index) => (declaration.test(line) ? [index] : []));
  if (matches.length !== 1) {
    throw new Error(`expected exactly one "type ${typeName} = {" in the declarations, found ${matches.length}`);
  }
  return matches[0];
}

/**
 * Event names declared as keys of the object type `typeName`, with their one-based line numbers.
 * Fails when the block is not closed where it started, holds a key that is not an event name, or
 * holds no keys at all, so a change in the file's layout cannot silently shrink the list.
 * @param {readonly string[]} lines
 * @param {string} typeName
 * @returns {{ name: string, line: number }[]}
 */
function objectTypeKeys(lines, typeName) {
  const start = findObjectTypeStart(lines, typeName);
  const baseIndent = indentOf(lines[start]);
  const keys = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "") continue;
    const indent = indentOf(line);
    if (indent <= baseIndent) {
      const isClosingBrace = indent === baseIndent && (line.trim() === "}" || line.trim() === "};");
      if (!isClosingBrace) throw new Error(`"type ${typeName}" is never closed: line ${index + 1} is not part of it`);
      if (keys.length === 0) throw new Error(`"type ${typeName}" has no event keys at ${baseIndent + KEY_INDENT_STEP} spaces of indent`);
      return keys;
    }
    if (indent !== baseIndent + KEY_INDENT_STEP) continue;
    const match = QUOTED_KEY.exec(line.trim());
    if (match === null) continue;
    if (!EVENT_NAME.test(match[1])) {
      throw new Error(`line ${index + 1} of "type ${typeName}" has key ${JSON.stringify(match[1].slice(0, 64))}, which is not <noun>.<Name>`);
    }
    keys.push({ name: match[1], line: index + 1 });
  }
  throw new Error(`"type ${typeName}" is never closed`);
}

/**
 * The lines of the declaration that starts at `declarationIndex`: up to the next declaration or the
 * window limit, so a member that lacks its own hook_event_name cannot borrow its neighbour's.
 * @param {readonly string[]} lines
 * @param {number} declarationIndex
 * @returns {readonly string[]}
 */
function declarationBody(lines, declarationIndex) {
  const window = lines.slice(declarationIndex + 1, declarationIndex + 1 + CLASSIC_DECLARATION_WINDOW);
  const nextDeclaration = window.findIndex((line) => DECLARATION.test(line));
  return nextDeclaration === -1 ? window : window.slice(0, nextDeclaration);
}

/**
 * The classic hook events: each member of the `HookInput` union declares one `hook_event_name`.
 * The event is named `classic.<hook_event_name>` and points at the member's declaration.
 * Member names come from the file, so they are checked as plain identifiers and looked up in a map
 * built in one pass: they are never turned into a pattern, and the cost stays linear in the file.
 * @param {readonly string[]} lines
 * @returns {{ name: string, line: number }[]}
 */
function classicKeys(lines) {
  const unionLine = lines.find((line) => HOOK_INPUT_PREFIX.test(line) && line.trimEnd().endsWith(";"));
  if (unionLine === undefined) throw new Error('expected a "type HookInput = A | B | ..." union in the declarations');
  const prefixLength = HOOK_INPUT_PREFIX.exec(unionLine)[0].length;
  const memberNames = unionLine.trimEnd().slice(prefixLength, -1).split("|").map((name) => name.trim());
  if (memberNames.length > MAX_CLASSIC_MEMBERS) {
    throw new Error(`HookInput lists ${memberNames.length} members, over the limit of ${MAX_CLASSIC_MEMBERS}`);
  }
  const invalidName = memberNames.find((name) => !IDENTIFIER.test(name));
  if (invalidName !== undefined) throw new Error(`HookInput member ${JSON.stringify(invalidName.slice(0, 64))} is not a plain identifier`);
  if (new Set(memberNames).size !== memberNames.length) throw new Error("HookInput lists a member twice");

  const declarationIndexByName = new Map();
  lines.forEach((line, index) => {
    const name = DECLARATION.exec(line)?.[1];
    if (name !== undefined && !declarationIndexByName.has(name)) declarationIndexByName.set(name, index);
  });

  return memberNames.map((memberName) => {
    const declarationIndex = declarationIndexByName.get(memberName);
    if (declarationIndex === undefined) throw new Error(`HookInput member ${memberName} is not declared`);
    const eventNames = declarationBody(lines, declarationIndex).flatMap((line) => HOOK_EVENT_NAME.exec(line)?.[1] ?? []);
    if (eventNames.length !== 1) {
      throw new Error(`${memberName} must declare exactly one hook_event_name, found ${eventNames.length}`);
    }
    return { name: `classic.${eventNames[0]}`, line: declarationIndex + 1 };
  });
}

/**
 * The version of Claude Code that wrote the declarations, from their first comment line, or null.
 * @param {string} text
 * @returns {string | null}
 */
export function claudeCodeVersionOf(text) {
  const head = text.replace(/^\uFEFF/, "").split("\n").slice(0, VERSION_SEARCH_LINES);
  return head.map((line) => VERSION_LINE.exec(line)?.[1]).find((version) => version !== undefined) ?? null;
}

/**
 * Every event the declarations define, sorted by name.
 *  - engine: `EngineEventOf`, the engine's own lifecycle (session.start, tool.call, ui.render).
 *  - op: `OpEventOf`, one per call on the `$` object (fs.write, http.fetch).
 *  - classic: one per classic hook, named classic.<hook_event_name>.
 * Events a plugin declares for its own noun (`NounEventOf`) are not listed: the declarations
 * leave that type empty until a plugin adds a noun, so it cannot be enumerated here.
 * @param {string} text contents of claude-code.d.ts
 * @returns {{ name: string, family: "engine" | "op" | "classic", line: number }[]}
 * @throws Error when the declarations no longer have the shape this reads, so a format change fails loudly
 */
export function extractEvents(text) {
  const lines = text.split("\n");
  const events = [
    ...objectTypeKeys(lines, "EngineEventOf").map((key) => ({ ...key, family: "engine" })),
    ...objectTypeKeys(lines, "OpEventOf").map((key) => ({ ...key, family: "op" })),
    ...classicKeys(lines).map((key) => ({ ...key, family: "classic" })),
  ];
  const seen = new Set();
  for (const event of events) {
    if (seen.has(event.name)) throw new Error(`event ${event.name} is declared twice`);
    seen.add(event.name);
  }
  return events.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
}

/**
 * @param {{ events: { name: string, family: string, line: number }[], sha: string, claudeCodeVersion: string | null, syncedAt: string }} input
 */
export function buildEventsFile({ events, sha, claudeCodeVersion, syncedAt }) {
  return {
    version: 1,
    source: { repository: UPSTREAM_REPOSITORY, path: DECLARATIONS_PATH, sha, claudeCodeVersion, syncedAt },
    events,
  };
}

/**
 * JSON with one event per line, so a change to the list is a readable diff.
 * @param {ReturnType<typeof buildEventsFile>} file
 * @returns {string}
 */
export function formatEventsFile(file) {
  const eventLines = file.events.map((event) => `    ${JSON.stringify(event)}`).join(",\n");
  return [
    "{",
    `  "version": ${JSON.stringify(file.version)},`,
    `  "source": ${JSON.stringify(file.source)},`,
    '  "events": [',
    eventLines,
    "  ]",
    "}",
    "",
  ].join("\n");
}

/**
 * What changed between two event lists, by name: added, removed, moved to another line, or moved to
 * another family. A moved line is not a change to the API, but it changes the source links, so it is
 * reported separately.
 * @param {readonly { name: string, family: string, line: number }[]} previousEvents
 * @param {readonly { name: string, family: string, line: number }[]} nextEvents
 * @returns {{ added: string[], removed: string[], moved: string[], refamilied: string[] }}
 */
export function diffEvents(previousEvents, nextEvents) {
  const previousByName = new Map(previousEvents.map((event) => [event.name, event]));
  const nextByName = new Map(nextEvents.map((event) => [event.name, event]));
  const shared = nextEvents.filter((event) => previousByName.has(event.name));
  return {
    added: nextEvents.filter((event) => !previousByName.has(event.name)).map((event) => event.name),
    removed: previousEvents.filter((event) => !nextByName.has(event.name)).map((event) => event.name),
    moved: shared.filter((event) => previousByName.get(event.name).line !== event.line).map((event) => event.name),
    refamilied: shared.filter((event) => previousByName.get(event.name).family !== event.family).map((event) => event.name),
  };
}
