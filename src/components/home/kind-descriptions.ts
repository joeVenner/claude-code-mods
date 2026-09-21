import type { ExtensionKind } from "@/lib/types";

/**
 * One-paragraph definitions shown on the kind explorer. The `mod` text follows the Mods README in
 * anthropics/claude-code. Claims about which mods exist, who publishes them or whether they are
 * early access come from the catalog entries (see `describeBuiltInMods`), never from this file.
 */
export const KIND_DESCRIPTIONS: Readonly<Record<ExtensionKind, string>> = {
  plugin: "A bundle that can package commands, agents, skills, hooks, and MCP servers, installed from a plugin marketplace.",
  skill: "A folder with a SKILL.md file of instructions that Claude loads when a task matches its description.",
  agent: "A subagent with its own system prompt, tool access, and context window, defined in a markdown file.",
  hook: "A shell command that runs at a fixed point in a session, such as before or after a tool call.",
  "mcp-server": "A program that gives Claude Code extra tools and data through the Model Context Protocol.",
  command: "A reusable prompt saved as a markdown file and run inside a session as a slash command.",
  mod: "A Claude Code plugin whose behavior lives in a hooks module that hooks engine events.",
};
