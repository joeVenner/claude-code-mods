/**
 * Long-form copy for the Learn pages, as typed data (see securityContent.ts). Every claim here comes
 * from one of the sources in `LEARN_SOURCES`, or from a command run on `TESTED_WITH`. Nothing is
 * copied from Anthropic's type declarations: they are published under "All rights reserved" terms.
 */

/** Where the copy comes from, so a reader can check it. */
export const LEARN_SOURCES = {
  announcementIssue: "https://github.com/anthropics/claude-code/issues/91870",
  modsReadme: "https://github.com/anthropics/claude-code/blob/main/mods/README.md",
  modsFolder: "https://github.com/anthropics/claude-code/tree/main/mods",
  modsTypes: "https://github.com/anthropics/claude-code/tree/main/mods/types",
  hooksDocs: "https://code.claude.com/docs/en/hooks",
  pluginsDocs: "https://code.claude.com/docs/en/plugins",
  skillsDocs: "https://code.claude.com/docs/en/skills",
  mcpDocs: "https://code.claude.com/docs/en/mcp",
} as const;

/** The environment variable that turns function hooks on, as the announcement issue's Sep 9 update names it. */
export const FUNCTION_HOOKS_FLAG = "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1";

/** What the commands on the Getting started page were run against, so a reader knows how old they are. */
export const TESTED_WITH = { claudeCodeVersion: "2.1.278", date: "2026-09-21" } as const;

export interface LearnSource {
  readonly label: string;
  readonly href: string;
}

export interface KindComparison {
  readonly id: string;
  readonly name: string;
  readonly whatItIs: string;
  readonly howYouWriteIt: string;
  readonly whatItCanDo: string;
  readonly source: LearnSource;
}

export const KIND_COMPARISON_COLUMNS = ["Kind", "What it is", "How you write it", "What it can do", "Source"] as const;

/** Ordered from the point of this site outward. Each row is written from the source it links. */
export const KIND_COMPARISON: readonly KindComparison[] = [
  {
    id: "mod",
    name: "Mod",
    whatItIs: "A plugin whose behaviour lives in a hooks module.",
    howYouWriteIt: "TypeScript functions shaped ($, e, next), registered with on(event, hook) in one register entry.",
    whatItCanDo:
      "Hooks the engine's own events: refuse or answer a tool call, add commands, draw interface elements. Early access.",
    source: { label: "Mods README", href: LEARN_SOURCES.modsReadme },
  },
  {
    id: "plugin",
    name: "Plugin",
    whatItIs: "A self-contained directory that packages other extensions so they can be shared.",
    howYouWriteIt: "A .claude-plugin/plugin.json manifest beside skills, agents, hooks or MCP servers.",
    whatItCanDo: "Bundles those pieces so a team can install and version them together. A mod is a plugin.",
    source: { label: "Plugins docs", href: LEARN_SOURCES.pluginsDocs },
  },
  {
    id: "classic-hook",
    name: "Classic hook",
    whatItIs: "A handler that Claude Code runs at a lifecycle event such as PreToolUse.",
    howYouWriteIt: "A shell command, HTTP endpoint, MCP tool call, prompt or subagent, set up in configuration.",
    whatItCanDo: "Receives JSON about the event and can block some of them: exit code 2 blocks a tool call at PreToolUse.",
    source: { label: "Hooks docs", href: LEARN_SOURCES.hooksDocs },
  },
  {
    id: "mcp-server",
    name: "MCP server",
    whatItIs: "An external tool or data source that Claude Code connects to over the Model Context Protocol.",
    howYouWriteIt: "Any program that speaks MCP, added with claude mcp add.",
    whatItCanDo: "Gives Claude tools to call, such as an issue tracker, a database or an API.",
    source: { label: "MCP docs", href: LEARN_SOURCES.mcpDocs },
  },
  {
    id: "skill",
    name: "Skill or slash command",
    whatItIs: "Instructions that Claude loads when they are relevant, or that you run as /skill-name.",
    howYouWriteIt: "A SKILL.md file with instructions, in a folder that can hold supporting files.",
    whatItCanDo:
      "Teaches Claude a procedure. Its body loads only when used. Custom commands in .claude/commands have been merged into skills.",
    source: { label: "Skills docs", href: LEARN_SOURCES.skillsDocs },
  },
];

export interface ConceptItem {
  readonly id: string;
  readonly term: string;
  readonly description: string;
  /** Where the description comes from. Every idea names at least one, so none is unsourced. */
  readonly sources: readonly LearnSource[];
}

const ANNOUNCEMENT: LearnSource = { label: "Announcement issue", href: LEARN_SOURCES.announcementIssue };
const MODS_README: LearnSource = { label: "Mods README", href: LEARN_SOURCES.modsReadme };
const MODS_TYPES: LearnSource = { label: "Mods type declarations", href: LEARN_SOURCES.modsTypes };

/** The five ideas a reader needs before the API makes sense, each with the source it is written from. */
export const CONCEPTS: readonly ConceptItem[] = [
  {
    id: "function-hook",
    term: "A hook is a function",
    description:
      "A classic hook is a handler, usually a shell command, that receives JSON about an event. A function hook is a TypeScript function that the engine calls with the event, so it has types and can return a value.",
    sources: [MODS_README, ANNOUNCEMENT],
  },
  {
    id: "the-dollar-object",
    term: "The $ object",
    description:
      "$ is the engine's own object, and the announcement says a mod's side effects are tracked over it. Each call on $ is one the engine makes, so a hook above the caller can pass it on, rewrite it, refuse it or answer it.",
    sources: [ANNOUNCEMENT, MODS_README, MODS_TYPES],
  },
  {
    id: "next",
    term: "next continues the chain",
    description:
      "Hooks nest in registration order, first outermost, like Express or Koa middleware. A hook calls next(e) to run the ones beneath it, returns { deny } to refuse, or returns a value to answer on its own.",
    sources: [ANNOUNCEMENT, MODS_TYPES],
  },
  {
    id: "administrators",
    term: "Administrators sit outermost",
    description:
      "An administrator can remove affordances from $ so that every plugin beneath cannot use that side effect. The sec-default mod is seated outermost on a machine with managed settings or for a Team or Enterprise organization, unless managed prependPlugins says otherwise.",
    sources: [ANNOUNCEMENT, MODS_README],
  },
  {
    id: "react",
    term: "Plugins can draw",
    description:
      "The announcement says Claude Code uses React across the board, and a hook can wrap or change what a component returns. The elements a render hook draws with come from $.ui.resolve(e), not from globals.",
    sources: [ANNOUNCEMENT, MODS_TYPES],
  },
];

export const MOD_FOLDER_TREE = [
  "mod-starter/",
  "  .claude-plugin/plugin.json   the plugin manifest",
  "  hooks/hooks.json             names the hooks module to load",
  "  hooks/register.ts            export function register(on)",
  "  hooks/is-force-push.ts       a plain helper, easy to test",
  "  tests/register.test.ts       run by claude plugin test",
  "  tests/is-force-push.test.ts  run by claude plugin test",
].join("\n");

/** What the hooks module's environment is, from the header of the type declarations `/plugin-types` writes. */
export const HOOKS_ENVIRONMENT_LIMITS: readonly string[] = [
  "There is no DOM and no Node, so there is no fs, no process and no require.",
  "Every file is an ES module, whatever its suffix, and a file whose name does not end in .ts, .tsx, .jsx, .js, .mjs, .cjs, .mts or .cts is not loaded.",
  "Use the web APIs the environment provides, such as URL and TextEncoder, and reach the outside world only through $.",
  "A mod can still act through $, which gives it files, the network and processes, and it can refuse or change any tool call.",
];

/** Shown before the commands that run a mod folder. Testing and loading run the mod's code; validate reads its source. */
export const RUN_WARNING: readonly string[] = [
  "Testing a mod, or loading it with --plugin-dir, runs its code with your permissions. validate reads its source and reports what it hooks without loading it.",
  "Read every file of a folder before you run it, and run only folders you trust. A mod can refuse or change any tool call and reach the outside world through $.",
  "Put the enable variable in front of the command, as the examples here do, so it is not left on for every later Claude Code session in your shell.",
];

/** What the starter's force push check does and does not catch, checked against the helper's own tests. */
export const STARTER_LIMITS =
  "This is a teaching example, not a security boundary. It catches --force, short flags that include f such as -fu, and forced refspecs such as +main. It does not see through wrappers such as sudo, env or bash -c, scripts or aliases, and it lets --force-with-lease, --delete and --mirror pass. Do not rely on it.";

export const TEST_KIT_NOTES: readonly string[] = [
  "A test receives the engine's own $ and a registrar on. The hooks a test registers with on sit beneath your mod, where the rest of the world would be, and a call they leave unanswered throws and names its event.",
  "The kit has no test.each. Register the cases with a loop, as the starter's helper tests do.",
  "tier('user') says the mod loads as an installed plugin would. A built-in mod uses tier('builtin').",
];
