// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import { getEvents } from "@/lib/events";
import { ALLOWED_CATALOG_HOSTS } from "@/lib/url";
import { LEARN_SOURCES } from "./learnContent";
import {
  CLASSIC_DIFFERENCES,
  CLASSIC_SETTINGS_JSON,
  CLASSIC_SHELL_GUARD,
  ENGINE_COUNTERPARTS,
  HOW_CHECKED,
  NO_OFFICIAL_GUIDE,
  PLUGIN_DEV_MIGRATION_URL,
  RESULT_MAPPING,
  SCOPE_NOTE,
} from "./migrationContent";

const KNOWN_SOURCES = Object.values(LEARN_SOURCES) as string[];
const NEGATIVE_FIXTURE = path.join(process.cwd(), "scripts", "fixtures", "classic-results.negative.ts");
const POSITIVE_FIXTURE = path.join(process.cwd(), "scripts", "fixtures", "classic-results.positive.ts");

describe("the upstream migration guide the report named", () => {
  it("is an https link on a trusted host, and is described as a command to prompt hook guide", () => {
    const url = new URL(PLUGIN_DEV_MIGRATION_URL);
    expect(url.protocol).toBe("https:");
    expect(ALLOWED_CATALOG_HOSTS as readonly string[]).toContain(url.hostname);
    expect(url.pathname).toMatch(/hook-development\/references\/migration\.md$/);
    expect(NO_OFFICIAL_GUIDE).toMatch(/no guide for moving classic hooks to function hooks/);
    expect(NO_OFFICIAL_GUIDE).toMatch(/command hooks to prompt hooks/);
  });
});

describe("SCOPE_NOTE", () => {
  it("says a classic hook can be more than a command, and that this page is about the command kind", () => {
    expect(SCOPE_NOTE).toMatch(/shell command, an HTTP endpoint, an MCP tool call, a prompt or a subagent/);
    expect(SCOPE_NOTE).toMatch(/This page is about command hooks/);
  });
});

describe("CLASSIC_DIFFERENCES", () => {
  it("has unique ids and names at least one known source for each difference", () => {
    expect(new Set(CLASSIC_DIFFERENCES.map((difference) => difference.id)).size).toBe(CLASSIC_DIFFERENCES.length);
    for (const difference of CLASSIC_DIFFERENCES) {
      expect(difference.sources.length, difference.id).toBeGreaterThan(0);
      for (const source of difference.sources) expect(KNOWN_SOURCES, difference.id).toContain(source.href);
    }
  });

  it("says the test kit has no call that fires a classic event, which is why one is not tested", () => {
    const checking = CLASSIC_DIFFERENCES.find((difference) => difference.id === "checking");
    expect(checking?.description).toMatch(/the kit's \$ has no call that fires a classic event/);
  });

  it("scopes 'where it lives' and 'what runs' to a classic command hook, not every classic hook", () => {
    for (const id of ["where", "what-runs"]) {
      const difference = CLASSIC_DIFFERENCES.find((candidate) => candidate.id === id);
      expect(difference?.description, id).toMatch(/classic command hook/);
    }
  });

  it("attributes a failing hook being skipped to the engine events, not to one event by name", () => {
    const failure = CLASSIC_DIFFERENCES.find((difference) => difference.id === "failure");
    expect(failure?.description).toMatch(/a hook that throws, overruns its time budget or answers a wrong shape is skipped/);
    expect(failure?.description).not.toMatch(/agent\.spawn/);
  });
});

describe("RESULT_MAPPING", () => {
  it("has unique ids, at least one known source for each row and no empty cell", () => {
    expect(new Set(RESULT_MAPPING.map((row) => row.id)).size).toBe(RESULT_MAPPING.length);
    for (const row of RESULT_MAPPING) {
      expect(row.classic.trim(), row.id).not.toBe("");
      expect(row.functionHook.trim(), row.id).not.toBe("");
      expect(row.sources.length, row.id).toBeGreaterThan(0);
      for (const source of row.sources) expect(KNOWN_SOURCES, row.id).toContain(source.href);
    }
  });

  it("maps a block to block on the events that can block, and to deny for classic.PreToolUse only", () => {
    const block = RESULT_MAPPING.find((row) => row.id === "block");
    expect(block?.classic).toMatch(/On an event that can block/);
    expect(block?.functionHook).toContain("{ block: reason }");
    expect(block?.functionHook).toContain("{ deny: reason } on classic.PreToolUse");
  });

  it("says classic.PreToolUse has no stopReason, not that every event does", () => {
    const stop = RESULT_MAPPING.find((row) => row.id === "stop");
    expect(stop?.functionHook).toMatch(/every classic event except classic\.PreToolUse/);
  });

  it("says e is typed read-only, not simply read-only", () => {
    const input = RESULT_MAPPING.find((row) => row.id === "input");
    expect(input?.functionHook).toMatch(/e is typed read-only/);
  });

  it("names permissionDecision's defer, which has no function hook counterpart", () => {
    const permission = RESULT_MAPPING.find((row) => row.id === "permission");
    expect(permission?.classic).toMatch(/\bdefer\b/);
    expect(permission?.functionHook).toMatch(/has no defer/);
  });
});

describe("ENGINE_COUNTERPARTS, checked against the synced events", () => {
  const eventNames = new Set(getEvents().map((event) => event.name));

  it("names only engine events and classic events that exist in events.json", () => {
    for (const pair of ENGINE_COUNTERPARTS) {
      expect(eventNames.has(pair.engineEvent), pair.engineEvent).toBe(true);
      expect(eventNames.has(`classic.${pair.classicEvent}`), pair.classicEvent).toBe(true);
    }
  });

  it("pairs each classic event with an engine event, not a classic or an op one", () => {
    const families = new Map(getEvents().map((event) => [event.name, event.family]));
    for (const pair of ENGINE_COUNTERPARTS) expect(families.get(pair.engineEvent), pair.engineEvent).toBe("engine");
  });

  it("says session.end runs after its settings hooks and is observed, not that it sits inside one", () => {
    const sessionEnd = ENGINE_COUNTERPARTS.find((pair) => pair.id === "session-end");
    expect(sessionEnd?.whatAFunctionHookCanDo).toMatch(/A hook here observes: its own value changes nothing/);
  });
});

describe("the worked example", () => {
  it("has a shell guard that reads stdin, blocks with exit 2 and a reason on stderr, and otherwise exits 0", () => {
    expect(CLASSIC_SHELL_GUARD).toContain("jq -r '.tool_input.command'");
    expect(CLASSIC_SHELL_GUARD).toContain('echo "rm is blocked by this hook" >&2');
    expect(CLASSIC_SHELL_GUARD).toContain("exit 2");
    expect(CLASSIC_SHELL_GUARD.trimEnd().endsWith("exit 0")).toBe(true);
  });

  it("has settings JSON that parses and attaches the script to Bash calls", () => {
    const settings = JSON.parse(CLASSIC_SETTINGS_JSON) as { hooks: { PreToolUse: { matcher: string; hooks: { type: string; command: string }[] }[] } };
    expect(settings.hooks.PreToolUse[0].matcher).toBe("Bash");
    expect(settings.hooks.PreToolUse[0].hooks[0]).toEqual({ type: "command", command: ".claude/hooks/block-rm.sh" });
  });

  it("matches the example mod's own force check: it starts with 'rm ', the shell pattern the guard also uses", () => {
    const register = readFileSync(path.join(process.cwd(), "templates", "migration-example", "hooks", "register.ts"), "utf8");
    expect(register).toContain("e.command.startsWith('rm ')");
    expect(CLASSIC_SHELL_GUARD).toContain("rm\\ *");
  });
});

describe("HOW_CHECKED", () => {
  it("counts the negative fixtures it says there are, and they still fail for the reason each names", () => {
    const fixture = readFileSync(NEGATIVE_FIXTURE, "utf8");
    // Count directive lines only: the header comment names the directive too.
    const directives = fixture.split("\n").filter((line) => /^\s*\/\/ @ts-expect-error /.test(line)).length;
    const words = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const claim = HOW_CHECKED.join(" ").match(/\b(\w+) negative fixtures\b/i)?.[1]?.toLowerCase() ?? "";
    expect(words.indexOf(claim) + 1, "the copy names a count").toBeGreaterThan(0);
    expect(directives).toBe(words.indexOf(claim) + 1);
  });

  it("says a positive fixture covers one hook per kind of result the table claims", () => {
    expect(HOW_CHECKED.join(" ")).toMatch(/a positive fixture with one hook for each kind of result in the table above must compile/);
    const positive = readFileSync(POSITIVE_FIXTURE, "utf8");
    for (const field of ["allow: true", "{ ask:", "{ deny:", "updatedInput", "additionalContext", "{ block:", "preventContinuation", "{ result:", "{ drop:", "{ skip:"]) {
      expect(positive, field).toContain(field);
    }
  });

  it("says what was not checked: run time behaviour, and a live session", () => {
    const text = HOW_CHECKED.join(" ");
    expect(text).toMatch(/Not checked: how the engine behaves at run time/);
    expect(text).toMatch(/not run in a live session/);
  });
});

describe("no copy on the page uses an em or en dash", () => {
  it("holds across every string", () => {
    const strings = [
      NO_OFFICIAL_GUIDE,
      SCOPE_NOTE,
      ...CLASSIC_DIFFERENCES.flatMap((difference) => [difference.term, difference.description]),
      ...RESULT_MAPPING.flatMap((row) => [row.classic, row.functionHook, ...row.sources.map((source) => source.label)]),
      ...ENGINE_COUNTERPARTS.flatMap((pair) => [pair.classicEvent, pair.engineEvent, pair.whatAFunctionHookCanDo]),
      CLASSIC_SHELL_GUARD,
      CLASSIC_SETTINGS_JSON,
      ...HOW_CHECKED,
    ];
    for (const text of strings) expect(text).not.toMatch(DASH_PATTERN);
  });
});
