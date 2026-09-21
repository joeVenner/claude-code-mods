// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAllExtensions } from "@/lib/catalog";
import {
  eventSourceUrl,
  getEvents,
  getEventsSource,
  loadEventsFile,
  nounOf,
  patternMatchesEvent,
} from "@/lib/events";
import { EVENT_FAMILIES, type HookEvent } from "@/lib/types";

/** Nouns that a built-in mod adds to `$` itself (the telemetry mod adds `$.telemetry`), so they are not core events. */
const PLUGIN_DECLARED_NOUNS = ["telemetry"] as const;

describe("the shipped events", () => {
  it("has every family, sorted by name, with unique names", () => {
    const events = getEvents();
    const names = events.map((event) => event.name);
    expect(names).toEqual([...names].sort());
    expect(new Set(names).size).toBe(names.length);
    for (const family of EVENT_FAMILIES) {
      expect(events.some((event) => event.family === family), family).toBe(true);
    }
  });

  it("knows every event that the Anthropic mods in the catalog hook by name", () => {
    const anthropicMods = getAllExtensions().filter(
      (extension) => extension.kind === "mod" && extension.publisher.kind === "anthropic",
    );
    expect(anthropicMods.length).toBeGreaterThan(0);
    const events = getEvents();
    const unknown = anthropicMods.flatMap((mod) =>
      mod.hooks
        // A noun that a plugin declares for itself has no core event to match, so name those nouns
        // here: a typo in a wildcard over a core noun (tol.*) must still be caught.
        .filter((hook) => !PLUGIN_DECLARED_NOUNS.some((noun) => hook.startsWith(`${noun}.`)))
        .filter((hook) => !patternMatchesEvent(hook, events))
        .map((hook) => `${mod.slug}: ${hook}`),
    );
    expect(unknown).toEqual([]);
  });
});

describe("nounOf", () => {
  it("is the part of the name before the dot", () => {
    expect(nounOf({ name: "fs.write", family: "op", line: 1 })).toBe("fs");
    expect(nounOf({ name: "classic.PreToolUse", family: "classic", line: 1 })).toBe("classic");
  });

  it("returns the whole name rather than a wrong slice when there is no dot", () => {
    expect(nounOf({ name: "tool", family: "engine", line: 1 })).toBe("tool");
  });
});

describe("eventSourceUrl", () => {
  it("links to the declared line at the pinned commit on github.com", () => {
    const source = { ...getEventsSource(), sha: "b".repeat(40) };
    const event: HookEvent = { name: "tool.call", family: "engine", line: 42 };
    expect(eventSourceUrl(source, event)).toBe(
      `https://github.com/anthropics/claude-code/blob/${"b".repeat(40)}/mods/types/claude-code.d.ts#L42`,
    );
  });
});

describe("patternMatchesEvent", () => {
  const events: readonly HookEvent[] = [
    { name: "tool.call", family: "engine", line: 1 },
    { name: "tool.list", family: "op", line: 2 },
    { name: "classic.Stop", family: "classic", line: 3 },
  ];

  it("matches an exact name, a namespace wildcard and the catch-all", () => {
    expect(patternMatchesEvent("tool.call", events)).toBe(true);
    expect(patternMatchesEvent("tool.*", events)).toBe(true);
    expect(patternMatchesEvent("classic.*", events)).toBe(true);
    expect(patternMatchesEvent("*", events)).toBe(true);
  });

  it("does not match unknown names, unknown namespaces or a prefix that is not a whole noun", () => {
    expect(patternMatchesEvent("tool.calls", events)).toBe(false);
    expect(patternMatchesEvent("telemetry.*", events)).toBe(false);
    expect(patternMatchesEvent("too.*", events)).toBe(false);
    expect(patternMatchesEvent("*", [])).toBe(false);
  });
});

describe("loadEventsFile", () => {
  let dataDirectory: string;

  beforeEach(() => {
    dataDirectory = mkdtempSync(path.join(tmpdir(), "events-loader-"));
  });

  afterEach(() => {
    rmSync(dataDirectory, { recursive: true, force: true });
  });

  const source = {
    repository: "anthropics/claude-code",
    path: "mods/types/claude-code.d.ts",
    sha: "c".repeat(40),
    claudeCodeVersion: "2.1.277",
    syncedAt: "2026-09-21",
  };

  function writeEvents(value: unknown): void {
    writeFileSync(path.join(dataDirectory, "events.json"), JSON.stringify(value));
  }

  it("reads a valid file", () => {
    writeEvents({ version: 1, source, events: [{ name: "tool.call", family: "engine", line: 5 }] });
    expect(loadEventsFile(dataDirectory).events).toHaveLength(1);
  });

  it("accepts a declarations file that names no Claude Code version", () => {
    writeEvents({ version: 1, source: { ...source, claudeCodeVersion: null }, events: [{ name: "tool.call", family: "engine", line: 5 }] });
    expect(loadEventsFile(dataDirectory).source.claudeCodeVersion).toBeNull();
  });

  it.each([
    ["a duplicate name", [{ name: "tool.call", family: "engine", line: 1 }, { name: "tool.call", family: "op", line: 2 }], /duplicate event name/],
    ["a name with no noun", [{ name: "call", family: "engine", line: 1 }], /events\.0\.name/],
    ["a classic name in another family", [{ name: "classic.Stop", family: "engine", line: 1 }], /only classic events/],
    ["a classic family without the classic prefix", [{ name: "tool.call", family: "classic", line: 1 }], /only classic events/],
    ["a line of zero", [{ name: "tool.call", family: "engine", line: 0 }], /events\.0\.line/],
    ["no events", [], /events/],
  ])("rejects %s and names the field", (_label, events, expected) => {
    writeEvents({ version: 1, source, events });
    expect(() => loadEventsFile(dataDirectory)).toThrow(expected);
  });

  it.each([
    ["a branch name instead of a commit", { ...source, sha: "main" }],
    ["another repository", { ...source, repository: "someone/else" }],
    ["another path", { ...source, path: "README.md" }],
    ["an unlikely version", { ...source, claudeCodeVersion: "latest" }],
  ])("rejects a source with %s", (_label, badSource) => {
    writeEvents({ version: 1, source: badSource, events: [{ name: "tool.call", family: "engine", line: 5 }] });
    expect(() => loadEventsFile(dataDirectory)).toThrow(/source\./);
  });

  it("says which file is missing or not JSON", () => {
    expect(() => loadEventsFile(dataDirectory)).toThrow(/events\.json: cannot read file/);
    writeFileSync(path.join(dataDirectory, "events.json"), "{ nope");
    expect(() => loadEventsFile(dataDirectory)).toThrow(/events\.json: not valid JSON/);
  });
});
