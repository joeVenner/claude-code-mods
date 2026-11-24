import type { Article, ArticleSource } from "@/lib/articles";

/**
 * The articles under `/learn/articles/`. Every claim restates Anthropic's own docs or the Claude
 * Code changelog, and each section names the page it comes from. Dates and versions come from the
 * changelog (https://code.claude.com/docs/en/changelog), checked on the article's `updatedAt` day.
 *
 * Inline forms in text: `code` and [label](href). Code blocks are shown exactly as written.
 */

const DOCS = "https://code.claude.com/docs/en";

const SOURCES = {
  changelog: { label: "Claude Code changelog", href: `${DOCS}/changelog` },
  codeMode: { label: "Run tool calls from code with Code Mode", href: `${DOCS}/code-mode` },
  modsOverview: { label: "Mods overview", href: `${DOCS}/plugins/mods/overview` },
  modsInterface: { label: "Draw in the interface with a mod", href: `${DOCS}/plugins/mods/interface` },
  modsReference: { label: "Mods reference", href: `${DOCS}/plugins/mods/reference` },
  modsEvents: { label: "React to events with a mod", href: `${DOCS}/plugins/mods/events` },
  hooksReference: { label: "Hooks reference", href: `${DOCS}/hooks` },
  claudeShip: { label: "Claude Ship", href: `${DOCS}/claude-ship` },
  shipCommand: { label: "Get a pull request ready with /ship and /steward", href: `${DOCS}/ship-command` },
  shipTroubleshooting: { label: "Troubleshoot /ship and /steward", href: `${DOCS}/ship-command-troubleshooting` },
  codeReview: { label: "Code Review", href: `${DOCS}/code-review` },
  prSteward: { label: "PR Steward", href: `${DOCS}/pr-steward` },
  prStewardSetup: { label: "Set up PR Steward", href: `${DOCS}/pr-steward-setup` },
  approvals: { label: "Claude Approvals", href: `${DOCS}/approvals` },
  hostMarketplace: { label: "Host and maintain a marketplace", href: `${DOCS}/plugins/host-marketplace` },
  pluginsOrg: { label: "Manage plugins for your organization", href: `${DOCS}/plugins/org` },
} as const satisfies Record<string, ArticleSource>;

const CODE_MODE_SLUG = "code-mode";
const THEMES_SLUG = "custom-themes-with-mods";
const BLOCKING_HOOKS_SLUG = "hooks-that-block-actions";
const EASEL_SLUG = "easel-charts-mod";
const CLAUDE_SHIP_SLUG = "claude-ship";
const MARKETPLACE_AUTOUPDATE_SLUG = "marketplace-auto-update-change";

const CODE_MODE: Article = {
  slug: CODE_MODE_SLUG,
  title: "Code Mode in Claude Code, explained",
  description:
    "Code Mode lets Claude write JavaScript that makes many tool calls in one step. How to turn it on, what it needs, its limits and how permissions and hooks apply.",
  headline: "Code Mode: Claude writes JavaScript that calls its tools",
  publishedAt: "2026-11-20",
  updatedAt: "2026-11-24",
  checkedAgainstVersion: "2.1.331",
  relatedSlugs: [BLOCKING_HOOKS_SLUG, THEMES_SLUG],
  sections: [
    {
      id: "what-it-is",
      title: "What Code Mode is",
      blocks: [
        {
          kind: "callout",
          tone: "note",
          text: "Code Mode is experimental and off by default. Anthropic's docs say it may change or be removed in any release. It arrived in Claude Code v2.1.323, released on November 12, 2026.",
        },
        {
          kind: "paragraph",
          text: "Without Code Mode, Claude asks for one tool call at a time, such as Bash, Read or Edit, and reads each result before it decides what to do next. With Code Mode on, Claude writes a piece of JavaScript that makes the tool calls, and Claude Code runs that code in your session. One piece of code can run commands in parallel, feed one result into the next call, and return only the part of the output Claude needs to read.",
        },
        {
          kind: "paragraph",
          text: "This is the example from the docs. Asked to raise a retry limit, Claude finds the file, edits it and runs the tests in one step, and the last line returns the file's path and the test output:",
        },
        {
          kind: "code",
          label: "Code Mode script from the docs",
          code: [
            'const files = await $`rg -l "function retryPolicy" src`.text();',
            'const target = files.trim().split("\\n")[0];',
            'await edit(target, "maxAttempts: 3", "maxAttempts: 5");',
            "({ edited: target, tests: $`npm test -- retryPolicy`.nothrow() });",
          ].join("\n"),
        },
        {
          kind: "paragraph",
          text: "In the conversation you see the tool calls, such as the edit's diff, and not the code. Press `Ctrl+O` to open the transcript viewer, where each piece of code is a collapsed Code row you can expand.",
        },
      ],
      sources: [SOURCES.codeMode, SOURCES.changelog],
    },
    {
      id: "when-to-use-it",
      title: "When it helps, and what you give up",
      blocks: [
        { kind: "paragraph", text: "The docs suggest Code Mode for tasks that take many related tool calls:" },
        {
          kind: "list",
          items: [
            "A change that repeats across many files",
            "A search whose results need filtering before Claude reads them",
            "Several independent commands that can run at the same time",
          ],
        },
        { kind: "paragraph", text: "Check these limits before you turn it on:" },
        {
          kind: "list",
          items: [
            "You can resume a Code Mode session only in the terminal, with Code Mode on.",
            "In auto mode, the classifier reviews each piece of code, not each tool call inside it.",
            "Unless code runs in the background, you wait for it, and it stops after ten minutes.",
            "Remote Control, Claude in Chrome and computer use are not available.",
            "You can't move the session to the Desktop app or turn it into a background session, and `/fork` can't start a background copy.",
          ],
        },
      ],
      sources: [SOURCES.codeMode],
    },
    {
      id: "requirements",
      title: "What it needs",
      blocks: [
        {
          kind: "list",
          items: [
            "Claude Code v2.1.323 or later, on the native build. On Windows, Git for Windows must be installed.",
            "A Claude subscription or Console account. It does not work through a gateway, Amazon Bedrock, Claude Platform on AWS, Google Cloud's Agent Platform or Microsoft Foundry.",
            "An organization that doesn't use the HIPAA configuration or zero data retention.",
            "Claude Opus 5.5, Sonnet 5.5, Haiku 5.5 or Fable 5.2.",
            "An interactive `claude` session in a terminal. It doesn't work with `-p`, the Agent SDK, the VS Code panel, the Desktop app or cloud sessions.",
            "For agent teams, v2.1.326 or later. Teammates run in Code Mode in the in-process display mode and start without it in split panes.",
          ],
        },
        {
          kind: "callout",
          tone: "note",
          text: "The changelog for v2.1.331, dated November 23, 2026, says Code Mode support was added in terminal sessions on Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry and Claude Platform on AWS. When this article was checked on November 24, 2026, the Code Mode page still listed those providers as unsupported, so read the page and `/status` for your setup before you rely on it.",
        },
        {
          kind: "paragraph",
          text: "Some settings also keep it off, such as an API key helper or `DISABLE_TELEMETRY`. When Code Mode can't start, the session shows `Code Mode (experimental) isn't available` with the reason, and `/status` shows the same reason. Since v2.1.329 it can run with OpenTelemetry events and metrics on, and each tool call the code makes sends its own events. Tracing still keeps it off.",
        },
      ],
      sources: [SOURCES.codeMode, SOURCES.changelog],
    },
    {
      id: "turn-it-on",
      title: "Turn it on, and off",
      blocks: [
        {
          kind: "paragraph",
          text: "Run `claude --version` and update with `claude update` if you are below v2.1.323. Then set `CLAUDE_CODE_EXPERIMENTAL_CODE_MODE` to `1`, either for one session from your shell:",
        },
        { kind: "code", label: "Start one session with Code Mode on", code: "CLAUDE_CODE_EXPERIMENTAL_CODE_MODE=1 claude" },
        { kind: "paragraph", text: "or for every new session, in your user settings:" },
        {
          kind: "code",
          filename: "~/.claude/settings.json",
          code: ['{', '  "env": {', '    "CLAUDE_CODE_EXPERIMENTAL_CODE_MODE": "1"', "  }", "}"].join("\n"),
        },
        {
          kind: "paragraph",
          text: "Claude Code ignores this variable in a project's settings files, so a repository you clone can't turn Code Mode on for you. Before your first Code Mode session it asks you to confirm. After you pick Yes, it restarts and shows `Code Mode (experimental) is on` near the top of the session.",
        },
        {
          kind: "callout",
          tone: "warning",
          text: "Keep the variable set to `1` when you run `claude --continue` or `claude --resume` on a Code Mode session. With Code Mode off, Claude Code refuses to resume it.",
        },
        {
          kind: "paragraph",
          text: "To turn it off, remove the variable or set it to `0`. A `0` in either your shell or your settings wins over a `1` in the other. An administrator can set it to `0` in managed settings so nobody in the organization can use Code Mode. Managed settings can't turn it on for users.",
        },
      ],
      sources: [SOURCES.codeMode],
    },
    {
      id: "permissions-and-hooks",
      title: "How permissions and hooks see the code",
      blocks: [
        {
          kind: "paragraph",
          text: "Each tool call in the code still goes through your `deny` and `ask` permission rules and your `PreToolUse` hooks, under the tool's usual name such as `Bash`. In the modes that ask, you are prompted for each call that would prompt you anyway. In auto mode, the classifier reviews the code before it runs. It doesn't see values computed at run time, such as a path taken from search output, so keep rules or hooks for calls you must control.",
        },
        {
          kind: "paragraph",
          text: "The tool that runs the code is called `REPL`. Add an `ask` rule for `REPL` to approve each piece of code before it starts, match `REPL` in a `PreToolUse` hook to read the JavaScript from `tool_input.code`, or match it in a `PostToolUse` hook to check or redact what the code returns with `updatedToolOutput`.",
        },
        {
          kind: "code",
          filename: "~/.claude/settings.json",
          code: ['{', '  "permissions": {', '    "ask": ["REPL"]', "  }", "}"].join("\n"),
        },
        {
          kind: "paragraph",
          text: "Two hook details change. A shell command can reach your hook in another form, for example a `git push` in a folder named `app` as `cd 'app' && git push`, so check each part of a command. And a `PreToolUse` hook that can't start, is killed or times out refuses the call even without `onFailure`. Since v2.1.328, `UserPromptSubmit` hooks no longer receive code output, so move any check of code output to a `PostToolUse` hook. [Hooks that block Claude's actions](/learn/articles/hooks-that-block-actions/) covers the rules outside Code Mode.",
        },
      ],
      sources: [SOURCES.codeMode, SOURCES.changelog],
    },
    {
      id: "long-running-code",
      title: "Long-running code",
      blocks: [
        {
          kind: "paragraph",
          text: "Claude either waits for code to finish, in which case the code stops after ten minutes, or lets it run in the background for up to two hours while you keep talking. Background code needs a session started in auto or `bypassPermissions` mode. Press `Esc` to stop code while Claude is responding. To stop background code later, open `/tasks`, select the task and press `x`, then check `/tasks` for subagents, shell commands and MCP calls the code started.",
        },
        {
          kind: "paragraph",
          text: "Since v2.1.328, time you spend at a permission prompt in Manual and `acceptEdits` modes no longer counts toward the ten minutes.",
        },
      ],
      sources: [SOURCES.codeMode, SOURCES.changelog],
    },
  ],
};

const THEMES: Article = {
  slug: THEMES_SLUG,
  title: "Custom themes for Claude Code Desktop",
  description:
    "A mod can now recolor the Claude Desktop app's Code tab and draw a backdrop behind the chat. What $.theme does, which versions it needs and how to undo it.",
  headline: "Custom themes: recolor the Desktop app and add a backdrop with a mod",
  publishedAt: "2026-11-20",
  updatedAt: "2026-11-20",
  checkedAgainstVersion: "2.1.329",
  relatedSlugs: [CODE_MODE_SLUG, BLOCKING_HOOKS_SLUG],
  sections: [
    {
      id: "what-changed",
      title: "Themes are mods",
      blocks: [
        {
          kind: "paragraph",
          text: "A theme is a mod that calls `$.theme.set`. It can pass `colors`, which recolor the Desktop app's Code tab in light and dark mode, and a `backdrop`, which the Desktop or mobile app draws behind the conversation. `$.theme.clear()` takes both off. Claude Code in the terminal keeps its own colors and draws no backdrop.",
        },
        { kind: "paragraph", text: "The pieces arrived across three releases:" },
        {
          kind: "list",
          items: [
            "v2.1.319: `$.theme.set` and `$.theme.clear` replace `$.ui.backdrop`, which this release removed.",
            "v2.1.323: the backdrop takes a `scene` name and a top-level `overrideColorScheme`. Before it, the fields were `id` and `backdrop.colorScheme`.",
            "v2.1.324: colors in the Code tab. Check the Claude Code version shown in the Code tab, not your terminal's.",
          ],
        },
      ],
      sources: [SOURCES.modsInterface, SOURCES.modsReference],
    },
    {
      id: "ask-claude",
      title: "Ask Claude for a colors mod",
      blocks: [
        {
          kind: "paragraph",
          text: "The quickest way is to describe the colors. Start a local session in the Code tab and enter a prompt such as `make a mod that makes the app cream in light mode and dark brown in dark mode`. Claude writes the mod's files and asks you about them and about hot reloading. The Code tab changes color when the mod loads, and you can tell Claude what to adjust.",
        },
      ],
      sources: [SOURCES.modsInterface],
    },
    {
      id: "write-a-colors-mod",
      title: "Write a colors mod yourself",
      blocks: [
        {
          kind: "paragraph",
          text: "`makeColors` builds a full theme from a few hex colors. Ask Claude in the Code tab to copy `make-colors.js` and `make-colors.d.ts` from its plugin-authoring skill into your mod's `hooks/` folder, add the usual `plugin.json` and `hooks.json`, then set the colors when the session starts. This is the docs' `paper` example:",
        },
        {
          kind: "code",
          filename: "~/.claude/skills/paper/hooks/register.js",
          code: [
            "import { makeColors } from './make-colors.js'",
            "",
            "const { theme } = makeColors({",
            "  label: 'Paper',",
            "  // surface-0 is the background, text-primary is the main text, and text-muted is the faint text",
            "  light: {",
            "    gray: { anchors: { 'surface-0': '#efe6d3', 'text-primary': '#2a241d', 'text-muted': '#6a5f50' } },",
            "  },",
            "  dark: {",
            "    gray: { anchors: { 'surface-0': '#1f1a15', 'text-primary': '#f0e7d7', 'text-muted': '#aca08d' } },",
            "  },",
            "})",
            "",
            "export function register(on) {",
            "  on('session.start', async ($, e, next) => {",
            "    await $.theme.set({ colors: theme })",
            "    return next(e)",
            "  })",
            "}",
          ].join("\n"),
        },
        {
          kind: "paragraph",
          text: "A mod under `~/.claude/skills/` loads when a session starts, so start a new local session in the Code tab to see it. With these values the background is cream in light mode and dark brown in dark mode.",
        },
      ],
      sources: [SOURCES.modsInterface],
    },
    {
      id: "add-a-backdrop",
      title: "Put a backdrop behind the conversation",
      blocks: [
        {
          kind: "paragraph",
          text: "A backdrop takes two parts: a `$.theme.set` call that names a scene, and a `ui.render` hook on the `Backdrop` render site that draws it. Neither a reload of the mod nor `--resume` keeps the backdrop, so set it in `session.start`. This example from the docs needs v2.1.323 or later and adds a `/plain` command that takes the backdrop off:",
        },
        {
          kind: "code",
          filename: "hooks/register.js",
          code: [
            "export function register(on) {",
            "  on('session.start', async ($, e, next) => {",
            "    await $.theme.set({ backdrop: { scene: 'night-sky' }, overrideColorScheme: 'dark' })",
            "    await $.command.register({ name: 'plain', description: 'Take the backdrop off' })",
            "    return next(e)",
            "  })",
            "  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {",
            "    // This hook runs for every mod's backdrop, and another mod can use the same scene",
            "    if (e.props.plugin !== $.plugin.name || e.props.scene !== 'night-sky') return next(e)",
            "    const { Box, Text } = $.ui.resolve(e)",
            "    return Box({ backgroundColor: 'blue', children: [Text({ children: ['Night sky'] })] })",
            "  })",
            "  on('command.run', { command: 'plain' }, async ($) => {",
            "    const cleared = await $.theme.clear()",
            "    return { text: cleared.reason }",
            "  })",
            "}",
          ].join("\n"),
        },
        {
          kind: "paragraph",
          text: "`$.theme.set` resolves with `isDrawn: true` when a connected Desktop or mobile app says it draws backdrops. Otherwise `isDrawn` is `false` and `reason` says why, which is what you get in the terminal.",
        },
      ],
      sources: [SOURCES.modsInterface, SOURCES.modsReference],
    },
    {
      id: "one-theme-per-session",
      title: "One theme per session",
      blocks: [
        {
          kind: "paragraph",
          text: "A session has one theme. Any mod that calls `$.theme.set` replaces the backdrop and colors another mod set, and any mod that calls `$.theme.clear()` removes them, whichever mod set them. So pass `colors` and `backdrop` in the same call, run one theme mod at a time, and call `$.theme.clear()` only when the user asks for it.",
        },
        {
          kind: "callout",
          tone: "note",
          text: "Updating an older mod: change `$.ui.backdrop({ id: 'your-backdrop' })` to a `$.theme.set` call, and `$.ui.backdrop(undefined)` to `$.theme.clear()`.",
        },
      ],
      sources: [SOURCES.modsInterface],
    },
    {
      id: "fix-or-remove",
      title: "When colors don't show, and how to remove them",
      blocks: [
        { kind: "paragraph", text: "If a mod's colors don't appear in the Code tab, the docs list these causes:" },
        {
          kind: "list",
          items: [
            "An old Desktop app: update it, restart it and start a new local session in the Code tab.",
            "The mod didn't load: compare its files and paths with the example above.",
            "A refused theme: ask Claude to run the mod's `makeColors` call, and fix any entry in its `problems` list that starts with `Desktop won't paint this theme`.",
            "Another mod called `$.theme.set` or `$.theme.clear()` after yours.",
          ],
        },
        {
          kind: "paragraph",
          text: "To remove a theme, turn the mod off first, because a mod that is still on can set its colors again: move its folder out of `~/.claude/skills/` or out of the mods folder Claude wrote it to, or disable its plugin from Manage plugins. Then start a new local session. If colors stay, open Settings from the Code tab, search for `code appearance` and select Remove colors.",
        },
      ],
      sources: [SOURCES.modsInterface],
    },
  ],
};

const BLOCKING_HOOKS: Article = {
  slug: BLOCKING_HOOKS_SLUG,
  title: "Hooks that block Claude's actions",
  description:
    "Exit code 2, onFailure block and a mod's tool.call deny: three ways to stop a Claude Code action, and how to make a policy hook fail closed instead of open.",
  headline: "Hooks that block Claude's actions, and fail closed",
  publishedAt: "2026-11-20",
  updatedAt: "2026-11-20",
  checkedAgainstVersion: "2.1.329",
  relatedSlugs: [CODE_MODE_SLUG, THEMES_SLUG],
  sections: [
    {
      id: "fail-open",
      title: "By default, a broken hook lets the action through",
      blocks: [
        {
          kind: "paragraph",
          text: "On most events, when a hook fails or times out, Claude Code still carries out the action. That is the right default for a formatter, and the wrong one for a policy hook: a wrong script path or a crash then lets every tool call through. Claude Code gives you three ways to block an action, and two ways to make sure a failing guard blocks too.",
        },
        {
          kind: "callout",
          tone: "note",
          text: "Anthropic's docs don't use the term \"action hooks\". This article covers the hooks that can stop an action, which is what the term usually means.",
        },
      ],
      sources: [SOURCES.hooksReference],
    },
    {
      id: "exit-code-2",
      title: "Block on purpose: exit code 2",
      blocks: [
        {
          kind: "paragraph",
          text: "A `command` hook blocks by exiting with code 2. On a `PreToolUse` hook that blocks the tool call, and on `UserPromptSubmit` it blocks the prompt. Your stderr is the reason. On `PreToolUse`, a call blocked with exit 2 stays blocked even if the hook also prints JSON that allows it.",
        },
        {
          kind: "paragraph",
          text: "Exit code 1 does not block. Without valid JSON output it is a non-blocking error, even though 1 is the usual Unix failure code. If a hook enforces a policy, exit 2. When your script calls another check, pass the check's exit code on, for example with `|| exit $?`, or the hook exits with its last line's code.",
        },
        {
          kind: "paragraph",
          text: "Not every event can be blocked. `PermissionRequest` ignores exit 2, so deny through its `decision` object instead. On `Stop`, `SubagentStop`, `TaskCompleted` and `TeammateIdle`, exit 2 sends Claude back to work rather than refusing anything.",
        },
      ],
      sources: [SOURCES.hooksReference],
    },
    {
      id: "on-failure-block",
      title: "Fail closed: onFailure block",
      blocks: [
        {
          kind: "paragraph",
          text: "Set `\"onFailure\": \"block\"` on a `command`, `http` or `mcp_tool` hook, and a failure does what exit code 2 does on that event, except on `PermissionRequest`, where it denies the request. It needs v2.1.295 or later, and v2.1.328 or later on `mcp_tool` hooks. This hook blocks every Bash command if its check script fails:",
        },
        {
          kind: "code",
          filename: ".claude/settings.json",
          code: [
            "{",
            '  "hooks": {',
            '    "PreToolUse": [',
            "      {",
            '        "matcher": "Bash",',
            '        "hooks": [',
            "          {",
            '            "type": "command",',
            '            "command": "node",',
            '            "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/check-command.js"],',
            '            "onFailure": "block"',
            "          }",
            "        ]",
            "      }",
            "    ]",
            "  }",
            "}",
          ].join("\n"),
        },
        {
          kind: "paragraph",
          text: "To test it, leave `check-command.js` missing and ask Claude to run `ls`. The call is blocked with `failed; blocking because onFailure is \"block\"`. Without the field, the same missing script is a non-blocking error and `ls` runs. These count as a failure:",
        },
        {
          kind: "list",
          items: [
            "A command hook that can't start, or exits with a code other than 0 or 2, even if it printed JSON that allows the action",
            "An HTTP hook whose connection fails or whose status isn't 2xx",
            "An `mcp_tool` hook whose server isn't connected or whose tool returns an error",
            "A hook that reaches its `timeout`",
            "Output that can't be parsed or fails schema validation",
          ],
        },
        {
          kind: "paragraph",
          text: "The field has no effect on `Stop`, `SubagentStop`, `TaskCompleted` and `TeammateIdle` hooks, or on command hooks that run with `async` or `asyncRewake`. Code Mode handles `PreToolUse` failures differently: a hook that can't start, is killed or times out refuses the call there even without the field. See [Code Mode in Claude Code](/learn/articles/code-mode/).",
        },
      ],
      sources: [SOURCES.hooksReference, SOURCES.changelog, SOURCES.codeMode],
    },
    {
      id: "mods",
      title: "Block from a mod: tool.call and .catch",
      blocks: [
        {
          kind: "paragraph",
          text: "A mod's `tool.call` hook sees each tool Claude is about to use, including subagent and MCP calls. It refuses a call by returning `{ deny }` without calling `next`, and Claude reads the deny text as the tool's result, so write it as an instruction. Like a classic hook, a mod hook that throws or times out is skipped and the call goes on. Chain a `.catch` handler onto the registration to make it fail closed:",
        },
        {
          kind: "code",
          filename: "hooks/register.js",
          code: [
            "on('tool.call', { tool: 'Bash' }, guard).catch(async ($, e, next) => {",
            "  // guard had already called next, so return what came back",
            "  if (next.called) return next(e)",
            "  // next.error.kind says why the handler was asked, such as 'throw' or 'timeout'",
            "  return { deny: 'The command guard failed, so this command was not run: ' + next.error.kind }",
            "})",
          ].join("\n"),
        },
        {
          kind: "paragraph",
          text: "The handler has a shorter time limit of its own, and if it fails too, the hook is skipped as if it had no handler. Hooks in managed settings run before any mod's `tool.call` hook, and when one blocks the call, no mod hook runs for it.",
        },
      ],
      sources: [SOURCES.modsEvents],
    },
    {
      id: "which-to-use",
      title: "Which one to use",
      blocks: [
        {
          kind: "list",
          items: [
            "For a fixed command or path, use a permission rule such as `Bash(npm test)`. It takes no code.",
            "For a decision that needs logic, use a `PreToolUse` hook that exits 2, and add `\"onFailure\": \"block\"` so a broken hook can't wave calls through.",
            "To ask the user first, use a mod: a `tool.call` hook can wait on `$.ui.ask` and refuse when nobody answers.",
            "For a decision that depends on the moment, such as the current Git branch, the mods docs point to the `tool.check` event.",
          ],
        },
      ],
      sources: [SOURCES.modsEvents, SOURCES.hooksReference],
    },
  ],
};

const EASEL: Article = {
  slug: EASEL_SLUG,
  title: "easel: the built-in charts mod",
  description:
    "easel is a built-in Claude Code mod that draws charts for Claude and under MCP metrics results. What it needs, where it runs, and how to turn it off.",
  headline: "easel: the built-in mod that draws charts in Claude Code",
  publishedAt: "2026-11-21",
  updatedAt: "2026-11-21",
  checkedAgainstVersion: "2.1.330",
  relatedSlugs: [CODE_MODE_SLUG, THEMES_SLUG],
  sections: [
    {
      id: "what-it-is",
      title: "What easel is",
      blocks: [
        {
          kind: "paragraph",
          text: "The Claude Code changelog for v2.1.330, dated November 20, 2026, lists easel as a new built-in mod that draws charts when asked and under MCP metrics results. In `/plugin` it appears as `cc-plugin-easel`.",
        },
        {
          kind: "paragraph",
          text: "Anthropic's mods overview describes two behaviors: it gives Claude a tool for drawing charts, and it draws a chart automatically under an MCP result that comes in a supported time-series format, such as a Prometheus range query result.",
        },
      ],
      sources: [SOURCES.changelog, SOURCES.modsOverview],
    },
    {
      id: "requirements",
      title: "What it needs",
      blocks: [
        {
          kind: "list",
          items: [
            "Sign-in: a claude.ai subscription. The changelog names Pro and Max, and Team and Enterprise where available.",
            "Version: Claude Code v2.1.321 or later. Team and Enterprise require v2.1.326 or later.",
            "Platform: macOS or Linux outside WSL.",
          ],
        },
        {
          kind: "paragraph",
          text: "If `cc-plugin-easel` isn't listed in `/plugin`, check these three first. The docs list them as the requirements to check when the mod is missing.",
        },
      ],
      sources: [SOURCES.modsOverview, SOURCES.changelog],
    },
    {
      id: "turn-off",
      title: "Turn it off",
      blocks: [
        {
          kind: "paragraph",
          text: "To disable the mod, use `/plugin`. To stop only the automatic charts, turn off the Auto charts setting in `/config`. The changelog says the same for automatic charts: turn them off in `/config`.",
        },
        {
          kind: "paragraph",
          text: "Settings and flags that stop installed mods, such as `disableAllHooks`, `--bare` and `--safe-mode`, don't stop built-in mods.",
        },
      ],
      sources: [SOURCES.modsOverview, SOURCES.changelog],
    },
    {
      id: "policy",
      title: "MCP allowlists and denylists",
      blocks: [
        {
          kind: "paragraph",
          text: "The chart tool is built in, and v2.1.330 fixed a warning, \"MCP server blocked by enterprise policy: easel\", that showed at every start when an MCP allowlist or denylist excluded it. Per the changelog, the tool stays blocked in that case, and only the warning went away.",
        },
        {
          kind: "paragraph",
          text: "The same release fixed the built-in chart tool failing when Claude called it in [Code Mode](/learn/articles/code-mode/), which is experimental.",
        },
      ],
      sources: [SOURCES.changelog],
    },
  ],
};

const CLAUDE_SHIP: Article = {
  slug: CLAUDE_SHIP_SLUG,
  title: "Claude Ship: review, fix and approve PRs",
  description:
    "Claude Ship adds three GitHub pull request agents: Code Review, PR Steward and Claude Approvals. What each does, what it needs, and the separate /ship command.",
  headline: "Claude Ship: agents that review, fix and approve GitHub pull requests",
  publishedAt: "2026-11-24",
  updatedAt: "2026-11-24",
  checkedAgainstVersion: "2.1.331",
  relatedSlugs: [BLOCKING_HOOKS_SLUG, CODE_MODE_SLUG],
  sections: [
    {
      id: "what-it-is",
      title: "What Claude Ship is",
      blocks: [
        {
          kind: "paragraph",
          text: "Claude Ship is a set of agents for a team's GitHub pull requests. Anthropic's docs name three, and each one has its own job:",
        },
        {
          kind: "list",
          items: [
            "Code Review reads a change alongside the surrounding code and posts its findings as inline comments, ranked by severity. It is generally available.",
            "PR Steward works on failing checks, merge conflicts and review comments, and pushes commits with its fixes. It is in public beta.",
            "Claude Approvals is a pull request check that reports who still has to approve, following a policy file you write. It is in public beta.",
          ],
        },
        {
          kind: "paragraph",
          text: "Together they can take a pull request through review, fixes and an approval decision. Your settings and GitHub branch rules still decide what merges. Separately, the `/ship` and `/steward` commands do similar work from your own Claude Code session, on one pull request at a time.",
        },
        {
          kind: "callout",
          tone: "note",
          text: "The docs warn that Claude Ship uses AI and may miss bugs, security vulnerabilities or other issues. A review with no findings doesn't mean the code is error free or secure.",
        },
      ],
      sources: [SOURCES.claudeShip, SOURCES.codeReview, SOURCES.shipCommand],
    },
    {
      id: "ship-command",
      title: "/ship and /steward in your terminal",
      blocks: [
        {
          kind: "paragraph",
          text: "`/ship` opens a GitHub pull request for your change if the branch doesn't have one, reviews it with `/code-review`, and then starts a watch: Claude keeps checking the pull request from your session, works on failing checks, conflicts, reviewers' comments and its own findings, and pushes fixes. You merge it yourself. `/steward` skips the pull request and review steps and starts the watch on a pull request you already opened.",
        },
        {
          kind: "list",
          items: [
            "Claude Code v2.1.330 or later, run from the CLI in a terminal in your local clone. Cloud sessions don't have either command.",
            "The GitHub CLI 2.63 or later, signed in with `gh auth login`, and git 2.38 or later.",
            "A session that fetches feature flags: with `DISABLE_TELEMETRY` set or a third party provider, `/ship` isn't available.",
            "Auto mode if you want Claude to work unattended. In `bypassPermissions` mode no watch starts, and on native Windows no watch starts either.",
          ],
        },
        {
          kind: "paragraph",
          text: "Both commands run in your session, act under your `gh` and `git` sign-ins, and count against your own usage. Arguments include an effort level for the review (`/ship low`), a pull request number, `+botname` to also read that bot's comments, `stop` to end a watch and `terms` to show what Claude may do during one.",
        },
        {
          kind: "callout",
          tone: "warning",
          text: "`/ship` doesn't ask for confirmation. It can commit all your uncommitted changes, new files included, push and open the pull request after a few seconds unless you press `Esc`. Run `git status` first, and look inside your files for secrets: it only checks file names such as `.env`. In a public repository it doesn't commit uncommitted work for you.",
        },
      ],
      sources: [SOURCES.shipCommand, SOURCES.shipTroubleshooting],
    },
    {
      id: "watch-limits",
      title: "What a watch can and can't do",
      blocks: [
        {
          kind: "paragraph",
          text: "When Claude acts without a message from you, Claude Code blocks `gh` and `git` commands that merge or approve the pull request, turn on auto merge or force push. It also limits Claude to a short list of `gh` and `git` commands and refuses tools the watch doesn't need, such as connectors, `WebFetch` and `WebSearch`.",
        },
        {
          kind: "paragraph",
          text: "Those limits don't cover everything. If auto merge is already on, a fix Claude pushes can let GitHub merge. While Claude answers a message you type, the limits are off. And code from the base branch, from other people's pushes to your branch and from your own tests can run on your computer with your credentials, so the docs say to run a watch only where you trust everyone who can merge to the base branch or push to your branch.",
        },
        {
          kind: "paragraph",
          text: "A watch ends when the pull request is merged or closed, after seven days, when you press `Esc` or switch branch, or when the session ends. Type `/ship stop` to end one, and `/steward` to start it again. To keep repository instructions for watches, save `.claude/skills/steward/SKILL.md`; PR Steward reads the same file.",
        },
      ],
      sources: [SOURCES.shipCommand],
    },
    {
      id: "org-agents",
      title: "The agents your organization turns on",
      blocks: [
        {
          kind: "paragraph",
          text: "Code Review runs on Anthropic infrastructure with read only access to the repository, and doesn't build or run your code. Several agents look at the diff in parallel, a verification step drops false positives, and the rest are ranked and posted with a check run named Claude Code Review. Anyone with write access can comment `@claude review` to start one. Without the service, `/code-review` gives a review in your session on any plan.",
        },
        {
          kind: "paragraph",
          text: "PR Steward acts as the Claude GitHub App in a cloud session and bills your organization. By default it skips drafts, forks, pull requests opened by bots and authors without write access. To stop it on one pull request, remove the `claude-pr-steward-watching` label or comment `@claude stop`. It is designed not to approve or merge, so use branch protection to require the approvals you want.",
        },
        {
          kind: "paragraph",
          text: "Claude Approvals reads a policy in `.claude/approvals.yml`. This one, from the docs, asks for two people on every change, keeps Claude from approving, and starts in observe mode, where the check only shows what the policy would decide:",
        },
        {
          kind: "code",
          filename: ".claude/approvals.yml",
          code: [
            "version: 1",
            "mode: observe",
            "rules:",
            '  - purpose: "A change takes two people, and Claude doesn\'t approve."',
            '    paths: ["**"]',
            "    verdict: { claude: comments, seats: 2 }",
            "    advisory: [claude/code_review]",
          ].join("\n"),
        },
        {
          kind: "paragraph",
          text: "The check blocks a merge only where you make it a required check in GitHub. The author can fill a seat, a rule with `claude: approves` can approve a change nothing has reviewed, and a policy file can stop automatic Code Reviews unless a rule names `claude/code_review`, as the `advisory` line above does.",
        },
      ],
      sources: [SOURCES.codeReview, SOURCES.prSteward, SOURCES.approvals],
    },
    {
      id: "availability",
      title: "Who can use it, and what it costs",
      blocks: [
        {
          kind: "list",
          items: [
            "Plans: Claude organizations on Team and Enterprise plans, for repositories on GitHub. An Owner turns the agents on in Organization settings, under Claude Ship.",
            "Not available with Zero Data Retention, the HIPAA configuration or customer managed encryption keys. Approvals has further limits.",
            "Billing: each agent is billed by tokens through the organization's usage credits, separately from the plan's included usage. Turning usage credits off doesn't stop an agent that is on.",
            "PR Steward has no spend limit of its own until an Owner sets one.",
          ],
        },
        {
          kind: "paragraph",
          text: "The docs suggest turning on one agent at a time in one repository: Code Review first, then PR Steward set to Manual, so it starts only when someone with write access comments `@claude steward` or adds the `claude-pr-steward-watching` label, then Approvals in observe mode. To turn Claude Ship off, go the other way: Approvals before Code Review, because a policy can start billed reviews where Code Review is off. That leaves `/ship` and `/steward` on; an administrator turns them off with `skillOverrides` for `ship-local` and `steward` in managed settings.",
        },
      ],
      sources: [SOURCES.claudeShip, SOURCES.prStewardSetup, SOURCES.shipCommand],
    },
  ],
};

const MARKETPLACE_AUTOUPDATE: Article = {
  slug: MARKETPLACE_AUTOUPDATE_SLUG,
  title: "Marketplace auto-update default changes",
  description:
    "From November 30, 2026, plugin marketplaces in managed settings will auto-update by default. What changes, how to opt out, and what v2.1.331 adds.",
  headline: "Managed plugin marketplaces will auto-update by default from November 30, 2026",
  publishedAt: "2026-11-24",
  updatedAt: "2026-11-24",
  checkedAgainstVersion: "2.1.331",
  relatedSlugs: [CLAUDE_SHIP_SLUG, CODE_MODE_SLUG],
  sections: [
    {
      id: "what-changes",
      title: "What is changing",
      blocks: [
        {
          kind: "callout",
          tone: "warning",
          text: "This is a planned change, not something in the current release. The v2.1.331 changelog (November 23, 2026) says: in a future release, on or after November 30, 2026, plugin marketplaces in managed `extraKnownMarketplaces` will auto-update by default.",
        },
        {
          kind: "paragraph",
          text: "Today, Anthropic's docs say background auto-update is off for a marketplace by default. A user turns it on under Marketplaces in `/plugin`, or an administrator sets `\"autoUpdate\": true` on the marketplace's `extraKnownMarketplaces` entry in managed settings. Without auto-update, changes arrive when someone runs `/plugin marketplace update <name>` or `claude plugin update <plugin>@<name>`.",
        },
      ],
      sources: [SOURCES.changelog, SOURCES.hostMarketplace],
    },
    {
      id: "opt-out",
      title: "How to opt a marketplace out",
      blocks: [
        {
          kind: "paragraph",
          text: "The changelog gives one instruction: set `\"autoUpdate\": false` on the entry. An administrator who wants to keep updates manual can add it to each managed entry before the date. The docs cover where the update policy lives under [Set update policy](https://code.claude.com/docs/en/plugins/org#set-update-policy).",
        },
        {
          kind: "code",
          filename: "managed-settings.json",
          label: "Opt one managed marketplace out (shape follows the docs; use your own source)",
          code: '{\n  "extraKnownMarketplaces": {\n    "your-marketplace": {\n      "source": { "source": "github", "repo": "your-org/your-marketplace" },\n      "autoUpdate": false\n    }\n  }\n}',
        },
      ],
      sources: [SOURCES.changelog, SOURCES.pluginsOrg],
    },
    {
      id: "private",
      title: "Private marketplaces",
      blocks: [
        {
          kind: "paragraph",
          text: "Background auto-update uses the git credentials already on the machine and never prompts. If a check finds new commits or can't reach the remote, Claude Code clones the marketplace again and replaces the checkout, and the existing checkout stays if that clone fails. Users can set `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE=1` to keep the checkout when a check can't reach or authenticate to the remote.",
        },
        {
          kind: "paragraph",
          text: "A user gets a new copy of a plugin only when its computed version changes, so a marketplace owner who bumps `version` on each release controls when an update takes effect.",
        },
      ],
      sources: [SOURCES.hostMarketplace],
    },
    {
      id: "also-in-2-1-331",
      title: "Also in v2.1.331: optionalDependencies",
      blocks: [
        {
          kind: "paragraph",
          text: "The same release added `optionalDependencies` to plugin manifests: plugins that install with the plugin listing them and can be disabled or uninstalled on their own. It also made the plugin auto-update notice name plugins that were newly installed as dependencies, separately from updated plugins.",
        },
      ],
      sources: [SOURCES.changelog],
    },
  ],
};

/** Every article, in no particular order: pages sort them with `sortArticlesByNewest`. */
export const ARTICLES: readonly Article[] = [CODE_MODE, THEMES, BLOCKING_HOOKS, EASEL, CLAUDE_SHIP, MARKETPLACE_AUTOUPDATE];
