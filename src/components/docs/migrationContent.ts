import {
  HOOKS_DOCS,
  MODS_README,
  MODS_TYPES,
  type ConceptItem,
  type LearnSource,
} from "./learnContent";

/**
 * Copy for the Migration page, as typed data. Anthropic publishes no guide for moving classic hooks to
 * function hooks, so every row here is written from Anthropic's type declarations or the hooks docs,
 * and the page says how each part was checked. Nothing is copied from the declarations.
 */

/** The one upstream file the report that started the Learn section named as a migration guide. */
export const PLUGIN_DEV_MIGRATION_URL =
  "https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/hook-development/references/migration.md";

export const NO_OFFICIAL_GUIDE =
  "Anthropic publishes no guide for moving classic hooks to function hooks. The migration.md in the plugin-dev hook-development skill is about moving command hooks to prompt hooks, which is a different move. This page is written from Anthropic's type declarations and the hooks docs, and its last section says how each part was checked.";

/** A classic hook can be more than a command. This page covers the kind with exit codes. */
export const SCOPE_NOTE =
  "A classic hook can be a shell command, an HTTP endpoint, an MCP tool call, a prompt or a subagent. This page is about command hooks, the kind that talk through an exit code and JSON on stdout.";

/** The five differences a classic hook author meets first. Each names the source it is written from. */
export const CLASSIC_DIFFERENCES: readonly ConceptItem[] = [
  {
    id: "where",
    term: "Where it lives",
    description:
      "A classic command hook is set up in configuration and names a command. A mod is a plugin: its hooks/hooks.json names a hooks module, and the module's register entry hooks events.",
    sources: [HOOKS_DOCS, MODS_README],
  },
  {
    id: "what-runs",
    term: "What runs",
    description:
      "A classic command hook runs a command when its event fires. A function hook is a TypeScript function that the engine calls in an environment of its own, with no DOM and no Node.",
    sources: [HOOKS_DOCS, MODS_TYPES],
  },
  {
    id: "order",
    term: "Order",
    description:
      "The settings hooks that are not managed run at the innermost end of the chain, as core. Function hooks sit above them. Across plugins they nest by seat, and within one plugin in the order it registered them, first outermost. Managed settings hooks run before any module, and a block from them ends the chain above every module.",
    sources: [MODS_TYPES],
  },
  {
    id: "failure",
    term: "When a hook fails",
    description:
      "At every engine event, a hook that throws, overruns its time budget or answers a wrong shape is skipped, and the failure is reported by name. On a classic event, a result field of the wrong shape fails the hook in the same way. Types catch most wrong shapes before the mod runs.",
    sources: [MODS_TYPES],
  },
  {
    id: "checking",
    term: "Types and tests",
    description:
      "A function hook is typed against the declarations that /plugin-types writes. claude plugin test can run a mod's tests, but the kit's $ has no call that fires a classic event, so a hook on a classic.* event is checked by its types and by claude plugin validate, not by a test.",
    sources: [MODS_README, MODS_TYPES],
  },
];

export interface ResultMapping {
  readonly id: string;
  readonly classic: string;
  readonly functionHook: string;
  /** Every source the row rests on: the classic side comes from the hooks docs, the function side from the declarations. */
  readonly sources: readonly LearnSource[];
}

export const RESULT_MAPPING_COLUMNS = ["A classic command hook", "A function hook", "Source"] as const;

/** Classic output on the left, the value a function hook returns on the right. */
export const RESULT_MAPPING: readonly ResultMapping[] = [
  {
    id: "input",
    classic: "Reads the event as JSON on stdin.",
    functionHook:
      "Receives it as e, with the same fields. e is typed read-only, so return a changed copy. On classic.PreToolUse, e is the tool-call envelope: e.tool and, for Bash, e.command.",
    sources: [MODS_TYPES],
  },
  {
    id: "allow",
    classic: "Exits 0 and prints nothing.",
    functionHook: "Returns next(e), which runs the hooks beneath and, last, the settings hooks that are not managed.",
    sources: [MODS_TYPES],
  },
  {
    id: "block",
    classic: "On an event that can block: exits 2 with a reason on stderr, or prints a JSON decision of block.",
    functionHook:
      "Returns { block: reason } on the classic events that can block, and { deny: reason } on classic.PreToolUse. The hooks docs list which events can block. On the others exit 2 does not block, so there is nothing to move.",
    sources: [HOOKS_DOCS, MODS_TYPES],
  },
  {
    id: "stop",
    classic: "Prints JSON with continue set to false and a stopReason.",
    functionHook:
      "Returns preventContinuation: true, with stopReason for the text that is shown, on every classic event except classic.PreToolUse.",
    sources: [HOOKS_DOCS, MODS_TYPES],
  },
  {
    id: "context",
    classic: "Prints hookSpecificOutput.additionalContext.",
    functionHook: "Returns additionalContext, a list of strings with one entry for each hook, on the events that read it.",
    sources: [HOOKS_DOCS, MODS_TYPES],
  },
  {
    id: "permission",
    classic: "PreToolUse: prints a permissionDecision of allow, ask, deny or defer.",
    functionHook:
      "Returns { allow: true }, { ask: reason } or { deny: reason } from classic.PreToolUse. The result type has no defer, so a hook that defers has no counterpart here.",
    sources: [HOOKS_DOCS, MODS_TYPES],
  },
  {
    id: "updated-input",
    classic: "PreToolUse: prints hookSpecificOutput.updatedInput.",
    functionHook: "Returns updatedInput from classic.PreToolUse. It is checked against the tool's schema before the tool runs.",
    sources: [HOOKS_DOCS, MODS_TYPES],
  },
  {
    id: "other-fields",
    classic: "Other hookSpecificOutput fields, such as sessionTitle or watchPaths.",
    functionHook:
      "Returns a field of the same name. Each event reads only its own set of fields, and a field it does not read is a type error.",
    sources: [HOOKS_DOCS, MODS_TYPES],
  },
];

export interface EngineCounterpart {
  readonly id: string;
  /** The classic event, as a classic hook names it. */
  readonly classicEvent: string;
  /** The engine's own event the declarations relate to it. */
  readonly engineEvent: string;
  readonly whatAFunctionHookCanDo: string;
}

export const ENGINE_COUNTERPART_COLUMNS = ["Classic event", "Engine event", "What a function hook can do there"] as const;

/** The pairs the declarations relate themselves. An engine event with no documented link to a classic one is not listed. */
export const ENGINE_COUNTERPARTS: readonly EngineCounterpart[] = [
  {
    id: "pre-tool-use",
    classicEvent: "PreToolUse",
    engineEvent: "tool.call",
    whatAFunctionHookCanDo:
      "Return { deny: reason } to refuse the call, or { result } to answer it yourself. classic.PreToolUse shares this event's envelope.",
  },
  {
    id: "user-prompt-submit",
    classicEvent: "UserPromptSubmit",
    engineEvent: "prompt.submit",
    whatAFunctionHookCanDo:
      "Return { drop: reason } to stop the prompt. next(e) runs the hooks beneath and then the UserPromptSubmit settings hooks.",
  },
  {
    id: "pre-compact",
    classicEvent: "PreCompact",
    engineEvent: "session.compact",
    whatAFunctionHookCanDo:
      "Return { skip: reason } to veto a compaction. A classic PreCompact hook that blocks gets the same outcome.",
  },
  {
    id: "session-end",
    classicEvent: "SessionEnd",
    engineEvent: "session.end",
    whatAFunctionHookCanDo:
      "It fires after the SessionEnd settings hooks, and e.reason carries the same reason word the classic hook receives. A hook here observes: its own value changes nothing.",
  },
];

/** The classic hook this page's worked example starts from. It exits 2 to block, as the hooks docs describe. */
export const CLASSIC_SHELL_GUARD = `#!/bin/bash
# .claude/hooks/block-rm.sh: a PreToolUse hook for Bash
command=$(jq -r '.tool_input.command')
if [[ "$command" == rm\\ * ]]; then
  echo "rm is blocked by this hook" >&2
  exit 2
fi
exit 0`;

export const CLASSIC_SETTINGS_JSON = `{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": ".claude/hooks/block-rm.sh" }]
      }
    ]
  }
}`;

/** How each part of the page was checked. The commands are the ones a maintainer re-runs. */
export const HOW_CHECKED: readonly string[] = [
  "The names are the ones in the Hooks page's list: each classic event is classic.<Name>, and claude plugin validate accepts the example mod's three.",
  "The result shapes are checked by typechecking against Anthropic's declarations at the pinned commit. The example mod and a positive fixture with one hook for each kind of result in the table above must compile. Eight negative fixtures must fail to compile, for example a deny returned from classic.Stop, a bare PreToolUse name, a field an event does not read and a write to e, so a change in the declarations that breaks a claim here breaks the check.",
  "The exit codes and JSON fields on the classic side are from the hooks docs, and the shell script above was run: it exits 2 with its reason for an rm command and 0 for any other.",
  "Not checked: how the engine behaves at run time. The test kit has no call that fires a classic event, so no test here runs a classic.* hook, and the example mod was not run in a live session.",
];
