import { describe, expect, it } from "vitest";
import { builtInModExtension, sourceOnlyExtension, verifiedExtension } from "@/components/catalog/__fixtures__/extensions";
import {
  buildEventReference,
  filterEventRows,
  groupEventRows,
  type EventReferenceRow,
} from "@/lib/event-reference";
import { eventAnchorId, eventNamedBy, hookEventHrefs, hookSelectsEvent, isWildcardHook, patternMatchesEvent } from "@/lib/event-names";
import type { EventsFile, Extension, HookEvent } from "@/lib/types";

const SOURCE: EventsFile["source"] = {
  repository: "anthropics/claude-code",
  path: "mods/types/claude-code.d.ts",
  sha: "a".repeat(40),
  claudeCodeVersion: "2.1.277",
  syncedAt: "2026-09-21",
};

const EVENTS: readonly HookEvent[] = [
  { name: "classic.PostToolUse", family: "classic", line: 30 },
  { name: "classic.PreToolUse", family: "classic", line: 20 },
  { name: "fs.write", family: "op", line: 10 },
  { name: "session.start", family: "engine", line: 5 },
  { name: "tool.call", family: "engine", line: 6 },
  { name: "tool.list", family: "op", line: 11 },
];

function entry(base: Extension, slug: string, name: string, hooks: readonly string[]): Extension {
  return { ...base, slug, name, hooks: [...hooks] };
}

describe("hookSelectsEvent", () => {
  const toolCall = EVENTS[4];
  const preToolUse = EVENTS[1];

  it("selects by exact name, catch-all and namespace wildcard", () => {
    expect(hookSelectsEvent("tool.call", toolCall, false)).toBe(true);
    expect(hookSelectsEvent("*", toolCall, false)).toBe(true);
    expect(hookSelectsEvent("tool.*", toolCall, false)).toBe(true);
    expect(hookSelectsEvent("classic.*", preToolUse, false)).toBe(true);
  });

  it("selects a classic event written bare only when the entry may write it that way", () => {
    expect(hookSelectsEvent("PreToolUse", preToolUse, true)).toBe(true);
    expect(hookSelectsEvent("PreToolUse", preToolUse, false)).toBe(false);
    expect(hookSelectsEvent("PostToolUse", preToolUse, true)).toBe(false);
  });

  it("never selects a bare name for an event that is not a classic one", () => {
    expect(hookSelectsEvent("call", toolCall, true)).toBe(false);
    expect(hookSelectsEvent("start", EVENTS[3], true)).toBe(false);
    expect(hookSelectsEvent("tool.call", { name: "classic.tool.call" }, true)).toBe(false);
  });

  it("does not select on a prefix that is not a whole noun, or a longer name", () => {
    expect(hookSelectsEvent("too.*", toolCall, false)).toBe(false);
    expect(hookSelectsEvent("tool.calls", toolCall, false)).toBe(false);
    expect(hookSelectsEvent("tool", toolCall, false)).toBe(false);
  });

  it.each(["!tool.*", "", ".*", "classic", "classic.", "**", " tool.call", "TOOL.CALL"])("selects nothing for the odd name %j", (hook) => {
    expect(patternMatchesEvent(hook, EVENTS, true)).toBe(false);
  });
});

describe("patternMatchesEvent and eventNamedBy", () => {
  it("matches a bare classic name only when allowed, and reports a plugin noun as matching nothing", () => {
    expect(patternMatchesEvent("PostToolUse", EVENTS, true)).toBe(true);
    expect(patternMatchesEvent("PostToolUse", EVENTS)).toBe(false);
    expect(patternMatchesEvent("telemetry.*", EVENTS, true)).toBe(false);
  });

  it("names a single event only for a direct name, never for a wildcard", () => {
    expect(eventNamedBy("tool.call", EVENTS, false)?.name).toBe("tool.call");
    expect(eventNamedBy("PreToolUse", EVENTS, true)?.name).toBe("classic.PreToolUse");
    expect(eventNamedBy("PreToolUse", EVENTS, false)).toBeNull();
    expect(eventNamedBy("classic.*", EVENTS, true)).toBeNull();
    expect(eventNamedBy("*", EVENTS, true)).toBeNull();
    expect(eventNamedBy("nothing.here", EVENTS, true)).toBeNull();
  });

  it("builds an anchor id from the event name", () => {
    expect(eventAnchorId("classic.PreToolUse")).toBe("event-classic.PreToolUse");
  });

  it("tells a wildcard from a name", () => {
    expect([isWildcardHook("*"), isWildcardHook("tool.*"), isWildcardHook("tool.call"), isWildcardHook("PreToolUse")]).toEqual([true, true, false, false]);
  });
});

describe("hookEventHrefs", () => {
  it("links a hook that names one event, keyed by the hook as the entry writes it", () => {
    expect(hookEventHrefs(["tool.call", "PreToolUse"], EVENTS, "/hooks/", true)).toEqual(
      new Map([
        ["tool.call", "/hooks/#event-tool.call"],
        ["PreToolUse", "/hooks/#event-classic.PreToolUse"],
      ]),
    );
  });

  it("leaves a bare classic name unlinked for an entry that may not write it", () => {
    expect(hookEventHrefs(["PreToolUse"], EVENTS, "/hooks/", false).size).toBe(0);
  });

  it("gives no link to a wildcard, a plugin noun or a name that is not an event", () => {
    expect(hookEventHrefs(["classic.*", "*", "telemetry.*", "made.up"], EVENTS, "/hooks/", true).size).toBe(0);
  });

  it("is empty for no hooks", () => {
    expect(hookEventHrefs([], EVENTS, "/hooks/", true).size).toBe(0);
  });

  it("answers nothing for the names every object inherits, which a community entry can list", () => {
    const links = hookEventHrefs(["constructor", "__proto__", "toString", "hasOwnProperty", "tool.call"], EVENTS, "/hooks/", true);
    for (const hostile of ["constructor", "__proto__", "toString", "hasOwnProperty"]) expect(links.get(hostile), hostile).toBeUndefined();
    expect([...links.keys()]).toEqual(["tool.call"]);
  });
});

describe("buildEventReference", () => {
  const mod = entry(builtInModExtension, "mod-a", "Mod A", ["session.start", "tool.call", "classic.*", "telemetry.*"]);
  const plugin = entry(verifiedExtension, "plugin-a", "Plugin A", ["PreToolUse", "PostToolUse"]);
  const other = entry(sourceOnlyExtension, "other-a", "Other A", ["tool.call", "made.up"]);
  const reference = buildEventReference(SOURCE, EVENTS, [mod, plugin, other]);
  const row = (name: string): EventReferenceRow => {
    const found = reference.rows.find((candidate) => candidate.name === name);
    if (found === undefined) throw new Error(`no row ${name}`);
    return found;
  };

  it("has one row per event, in the order of the events", () => {
    expect(reference.rows.map((candidate) => candidate.name)).toEqual(EVENTS.map((event) => event.name));
  });

  it("gives each row its family, noun, anchor and a source link pinned to the commit and line", () => {
    expect(row("fs.write")).toMatchObject({ family: "op", noun: "fs", anchorId: "event-fs.write", line: 10 });
    expect(row("fs.write").sourceUrl).toBe(`https://github.com/anthropics/claude-code/blob/${"a".repeat(40)}/mods/types/claude-code.d.ts#L10`);
  });

  it("lists every entry that names an event, sorted by name, once each", () => {
    expect(row("tool.call").users.map((user) => user.slug)).toEqual(["mod-a", "other-a"]);
    expect(row("session.start").users.map((user) => user.slug)).toEqual(["mod-a"]);
  });

  it("says how an entry reached an event: a wildcard, or a bare classic name", () => {
    // The entry that names the event comes before the one that reaches it through a wildcard.
    expect(row("classic.PreToolUse").users.map((user) => [user.slug, user.via])).toEqual([
      ["plugin-a", "PreToolUse"],
      ["mod-a", "classic.*"],
    ]);
  });

  it("leaves an event no entry lists with no users", () => {
    expect(row("fs.write").users).toEqual([]);
    expect(row("tool.list").users).toEqual([]);
  });

  it("puts direct listers before wildcard listers, and says how each one reached the event", () => {
    const wildcardOnly = entry(builtInModExtension, "aaa-wild", "AAA Wild", ["classic.*"]);
    const direct = entry(verifiedExtension, "zzz-direct", "ZZZ Direct", ["PreToolUse"]);
    const built = buildEventReference(SOURCE, EVENTS, [wildcardOnly, direct]);
    expect(built.rows.find((candidate) => candidate.name === "classic.PreToolUse")?.users.map((user) => [user.slug, user.via])).toEqual([
      ["zzz-direct", "PreToolUse"],
      ["aaa-wild", "classic.*"],
    ]);
  });

  it("reports the hook that names an event, not an earlier wildcard, when an entry lists both", () => {
    const both = entry(verifiedExtension, "both", "Both", ["classic.*", "PreToolUse"]);
    const users = buildEventReference(SOURCE, EVENTS, [both]).rows.find((candidate) => candidate.name === "classic.PreToolUse")?.users;
    expect(users).toHaveLength(1);
    expect(users?.[0].via).toBe("PreToolUse");
    const other = buildEventReference(SOURCE, EVENTS, [both]).rows.find((candidate) => candidate.name === "classic.PostToolUse")?.users;
    expect(other?.[0].via).toBe("classic.*");
  });

  it("counts an entry once for an event even when it lists the event twice", () => {
    const twice = entry(builtInModExtension, "twice", "Twice", ["tool.call", "tool.call", "tool.*"]);
    const built = buildEventReference(SOURCE, EVENTS, [twice]);
    expect(built.rows.find((candidate) => candidate.name === "tool.call")?.users).toHaveLength(1);
  });

  it("does not accept a bare classic name from a mod, which names events as function hooks do", () => {
    const badMod = entry(builtInModExtension, "bad-mod", "Bad Mod", ["PreToolUse"]);
    const built = buildEventReference(SOURCE, EVENTS, [badMod]);
    expect(built.rows.find((candidate) => candidate.name === "classic.PreToolUse")?.users).toEqual([]);
    expect(built.otherNames.map((other) => other.name)).toEqual(["PreToolUse"]);
  });

  it("lists a hook that only looks like an event as an other name, never as a user of one", () => {
    const odd = entry(verifiedExtension, "odd", "Odd", ["!tool.*", "constructor", "__proto__"]);
    const built = buildEventReference(SOURCE, EVENTS, [odd]);
    expect(built.rows.every((candidate) => candidate.users.length === 0)).toBe(true);
    expect(built.otherNames.map((other) => other.name).sort()).toEqual(["!tool.*", "__proto__", "constructor"]);
  });

  it("collects names that select no event, for example a noun only a plugin declares", () => {
    expect(reference.otherNames.map((entryName) => entryName.name)).toEqual(["made.up", "telemetry.*"]);
    expect(reference.otherNames[1].entries.map((user) => user.slug)).toEqual(["mod-a"]);
  });

  it("carries the publisher kind and entry kind so the page can label community listings", () => {
    const community = { ...plugin, slug: "community-a", name: "Community A", publisher: { ...plugin.publisher, kind: "community" as const } };
    const built = buildEventReference(SOURCE, EVENTS, [community]);
    expect(built.rows.find((candidate) => candidate.name === "classic.PreToolUse")?.users[0]).toMatchObject({
      publisherKind: "community",
      kind: community.kind,
    });
  });

  it("is the same whatever order the entries come in", () => {
    const reversed = buildEventReference(SOURCE, EVENTS, [other, plugin, mod]);
    expect(reversed).toEqual(reference);
  });

  it("does not fail with no events or no entries, and every name is then an other name", () => {
    expect(buildEventReference(SOURCE, [], [mod]).rows).toEqual([]);
    expect(buildEventReference(SOURCE, [], [mod]).otherNames.map((other) => other.name)).toEqual([
      "classic.*",
      "session.start",
      "telemetry.*",
      "tool.call",
    ]);
    expect(buildEventReference(SOURCE, EVENTS, []).rows.every((candidate) => candidate.users.length === 0)).toBe(true);
  });
});

describe("filterEventRows", () => {
  const mod = entry(builtInModExtension, "mod-a", "Diff Pane", ["tool.call", "classic.*"]);
  const { rows } = buildEventReference(SOURCE, EVENTS, [mod]);

  it("returns every row for a blank query and the all family", () => {
    expect(filterEventRows(rows, { query: "", family: "all" })).toHaveLength(rows.length);
    expect(filterEventRows(rows, { query: "   ", family: "all" })).toHaveLength(rows.length);
  });

  it("matches the event name, ignoring case and surrounding space", () => {
    expect(filterEventRows(rows, { query: "  PRETOOL ", family: "all" }).map((row) => row.name)).toEqual(["classic.PreToolUse"]);
  });

  it("matches part of an event name, and the name of an entry that uses the event", () => {
    expect(filterEventRows(rows, { query: "tool", family: "all" }).map((row) => row.name)).toEqual([
      "classic.PostToolUse",
      "classic.PreToolUse",
      "tool.call",
      "tool.list",
    ]);
    // Diff Pane lists tool.call and classic.*, so it is a user of exactly these three rows.
    expect(filterEventRows(rows, { query: "diff pane", family: "all" }).map((row) => row.name)).toEqual([
      "classic.PostToolUse",
      "classic.PreToolUse",
      "tool.call",
    ]);
  });

  it("narrows by family and combines with the query", () => {
    expect(filterEventRows(rows, { query: "", family: "op" }).map((row) => row.name)).toEqual(["fs.write", "tool.list"]);
    expect(filterEventRows(rows, { query: "tool", family: "op" }).map((row) => row.name)).toEqual(["tool.list"]);
  });

  it("returns nothing, not everything, when nothing matches", () => {
    expect(filterEventRows(rows, { query: "zzz", family: "all" })).toEqual([]);
  });

  it("treats regular expression characters as plain text", () => {
    expect(filterEventRows(rows, { query: ".*", family: "all" })).toEqual([]);
    expect(filterEventRows(rows, { query: "(", family: "all" })).toEqual([]);
  });
});

describe("groupEventRows", () => {
  const { rows } = buildEventReference(SOURCE, EVENTS, []);

  it("groups by family in a fixed order, then by noun, keeping row order", () => {
    const groups = groupEventRows(rows);
    expect(groups.map((group) => group.family)).toEqual(["engine", "op", "classic"]);
    expect(groups[1].nouns.map((noun) => [noun.noun, noun.rows.map((row) => row.name)])).toEqual([
      ["fs", ["fs.write"]],
      ["tool", ["tool.list"]],
    ]);
    expect(groups.map((group) => group.count)).toEqual([2, 2, 2]);
  });

  it("leaves out a family with no rows, and returns nothing for no rows", () => {
    expect(groupEventRows(rows.filter((row) => row.family === "op")).map((group) => group.family)).toEqual(["op"]);
    expect(groupEventRows([])).toEqual([]);
  });
});
