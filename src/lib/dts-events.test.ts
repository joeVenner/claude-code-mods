import { describe, expect, it } from "vitest";
import {
  EVENT_FAMILIES as SCRIPT_EVENT_FAMILIES,
  buildEventsFile,
  claudeCodeVersionOf,
  diffEvents,
  extractEvents,
  formatEventsFile,
} from "../../scripts/lib/dts-events.mjs";
import { EVENT_FAMILIES, eventsFileSchema } from "@/lib/types";

/** A made-up declarations file with the same shape as the real one, so no upstream text is copied here. */
const FIXTURE = [
  "// Written by Claude Code 9.9.999.",
  "// Example declarations.",
  "declare module 'example' {",
  "  export type EngineEventOf = {",
  "      /**",
  "       * Comment lines are skipped, even ones that mention 'not.anEvent': here.",
  "       */",
  "      'tool.call': ToolCallInput;",
  "      'session.start': {",
  "          'nested.key': string;",
  "      };",
  "  };",
  "",
  "  export type OpEventOf = {",
  "      'fs.write': { path: string };",
  "      'clock.now': NoArgs;",
  "  };",
  "",
  "  export type OpValueOf = {",
  "      'fs.write': void;",
  "  };",
  "",
  "  type HookInput = PreToolUseHookInput | StopHookInput;",
  "  type PreToolUseHookInput = BaseHookInput & {",
  "      hook_event_name: 'PreToolUse';",
  "  };",
  "  interface StopHookInput extends BaseHookInput {",
  "      hook_event_name: 'Stop';",
  "  }",
  "}",
].join("\n");

describe("extractEvents", () => {
  it("lists engine, op and classic events sorted by name, each with its family and line", () => {
    expect(extractEvents(FIXTURE)).toEqual([
      { name: "classic.PreToolUse", family: "classic", line: 24 },
      { name: "classic.Stop", family: "classic", line: 27 },
      { name: "clock.now", family: "op", line: 16 },
      { name: "fs.write", family: "op", line: 15 },
      { name: "session.start", family: "engine", line: 9 },
      { name: "tool.call", family: "engine", line: 8 },
    ]);
  });

  it("does not read the types that follow an event block, nor keys nested inside one", () => {
    const names = extractEvents(FIXTURE).map((event) => event.name);
    expect(names.filter((name) => name === "fs.write")).toHaveLength(1);
    expect(names).not.toContain("nested.key");
    expect(names).not.toContain("not.anEvent");
  });

  it("fails loudly when a block is missing, so a format change is never silently swallowed", () => {
    expect(() => extractEvents(FIXTURE.replace("export type OpEventOf = {", "export type Renamed = {"))).toThrow(
      /exactly one "type OpEventOf = \{"/,
    );
  });

  it("fails, naming the line, when a block is not closed where it started", () => {
    const unclosed = FIXTURE.replace("  };\n\n  export type OpEventOf", "\n  export type OpEventOf");
    expect(() => extractEvents(unclosed)).toThrow(/"type EngineEventOf" is never closed: line 13 is not part of it/);
  });

  it("fails on a key at the key indent that is not <noun>.<Name>, instead of dropping it", () => {
    const renamed = FIXTURE.replace("'clock.now': NoArgs;", "'clock.now_v2': NoArgs;");
    expect(() => extractEvents(renamed)).toThrow(/key "clock\.now_v2", which is not <noun>\.<Name>/);
  });

  it("fails when a block has no keys at the expected indent, for example after a re-indent", () => {
    const reindented = FIXTURE.replace("      'fs.write': { path: string };\n      'clock.now': NoArgs;", "    'fs.write': { path: string };\n    'clock.now': NoArgs;");
    expect(() => extractEvents(reindented)).toThrow(/"type OpEventOf" has no event keys/);
  });

  it("fails when the same event is declared in two families", () => {
    const duplicated = FIXTURE.replace("'clock.now': NoArgs;", "'tool.call': NoArgs;");
    expect(() => extractEvents(duplicated)).toThrow(/tool\.call is declared twice/);
  });

  it("does not let a member borrow the hook_event_name of the declaration after it", () => {
    const missing = FIXTURE.replace("hook_event_name: 'PreToolUse';", "other: 1;");
    expect(() => extractEvents(missing)).toThrow(/PreToolUseHookInput must declare exactly one hook_event_name, found 0/);
  });

  it("fails when a classic member names two events", () => {
    const doubled = FIXTURE.replace("hook_event_name: 'Stop';", "hook_event_name: 'Stop';\n      hook_event_name: 'Halt';");
    expect(() => extractEvents(doubled)).toThrow(/StopHookInput must declare exactly one hook_event_name, found 2/);
  });

  it("fails when the HookInput union is missing", () => {
    expect(() => extractEvents(FIXTURE.replace("type HookInput =", "type Other ="))).toThrow(/HookInput/);
  });

  it("fails when a HookInput member is never declared", () => {
    expect(() => extractEvents(FIXTURE.replace("| StopHookInput;", "| GhostHookInput;"))).toThrow(/GhostHookInput is not declared/);
  });

  describe("with hostile HookInput members", () => {
    it("never builds a pattern from a member name, so a catastrophic one finishes at once", () => {
      const hostile = FIXTURE.replace("PreToolUseHookInput | StopHookInput", "(a+)+b | StopHookInput");
      const startedAt = performance.now();
      expect(() => extractEvents(hostile)).toThrow(/not a plain identifier/);
      expect(performance.now() - startedAt).toBeLessThan(1000);
    });

    it("shows a control character escaped in the message, never raw", () => {
      const withEscape = FIXTURE.replace("PreToolUseHookInput | StopHookInput", "\u001b]0;x\u0007 | StopHookInput");
      let message = "";
      try {
        extractEvents(withEscape);
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toMatch(/not a plain identifier/);
      expect(message).not.toMatch(/[\u0000-\u001f]/);
    });

    it("rejects a member listed twice", () => {
      expect(() => extractEvents(FIXTURE.replace("PreToolUseHookInput | StopHookInput", "StopHookInput | StopHookInput"))).toThrow(
        /lists a member twice/,
      );
    });

    it("rejects a union longer than any real one", () => {
      const members = Array.from({ length: 201 }, (_, index) => `Member${index}`).join(" | ");
      expect(() => extractEvents(FIXTURE.replace("PreToolUseHookInput | StopHookInput", members))).toThrow(/over the limit of 200/);
    });
  });
});

describe("claudeCodeVersionOf", () => {
  it("reads the version from the first comment lines", () => {
    expect(claudeCodeVersionOf(FIXTURE)).toBe("9.9.999");
  });

  it("reads it past a byte order mark", () => {
    expect(claudeCodeVersionOf(`\uFEFF${FIXTURE}`)).toBe("9.9.999");
  });

  it("returns null when the first lines name no version, or only a later line does", () => {
    expect(claudeCodeVersionOf("// No version here\n")).toBeNull();
    expect(claudeCodeVersionOf(`${"//\n".repeat(6)}// Written by Claude Code 1.2.3.`)).toBeNull();
  });
});

describe("buildEventsFile and formatEventsFile", () => {
  const events = extractEvents(FIXTURE);
  const file = buildEventsFile({ events, sha: "a".repeat(40), claudeCodeVersion: "9.9.999", syncedAt: "2026-09-21" });

  it("pins the source repository, path and commit", () => {
    expect(file.source).toEqual({
      repository: "anthropics/claude-code",
      path: "mods/types/claude-code.d.ts",
      sha: "a".repeat(40),
      claudeCodeVersion: "9.9.999",
      syncedAt: "2026-09-21",
    });
  });

  it("produces a file the loader's schema accepts, and uses the same families as the schema", () => {
    expect(eventsFileSchema.safeParse(file).success).toBe(true);
    expect([...SCRIPT_EVENT_FAMILIES]).toEqual([...EVENT_FAMILIES]);
  });

  it("writes valid JSON with one event per line and a final newline", () => {
    const text = formatEventsFile(file);
    expect(JSON.parse(text)).toEqual(file);
    expect(text.endsWith("}\n")).toBe(true);
    expect(text.split("\n").filter((line) => line.includes('"name"'))).toHaveLength(events.length);
  });
});

describe("diffEvents", () => {
  const event = (name: string, line: number, family = "engine") => ({ name, family, line });

  it("reports names added and removed, and nothing for a re-order", () => {
    expect(diffEvents([event("a.one", 1), event("a.two", 2)], [event("a.two", 2), event("a.three", 3)])).toMatchObject({
      added: ["a.three"],
      removed: ["a.one"],
    });
    expect(diffEvents([event("a.one", 1), event("a.two", 2)], [event("a.two", 2), event("a.one", 1)])).toEqual({
      added: [],
      removed: [],
      moved: [],
      refamilied: [],
    });
  });

  it("reports an event that moved lines or changed family, which change the source links", () => {
    expect(diffEvents([event("a.one", 1), event("a.two", 2)], [event("a.one", 9), event("a.two", 2, "op")])).toEqual({
      added: [],
      removed: [],
      moved: ["a.one"],
      refamilied: ["a.two"],
    });
  });
});
