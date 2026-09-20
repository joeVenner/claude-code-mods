import type { ExtensionKind } from "@/lib/types";

/**
 * Neutral one-line definitions shown on the kind explorer. `mod` is deliberately hedged:
 * it comes from the marketplace spec and is not a confirmed Claude Code feature.
 */
export const KIND_DESCRIPTIONS: Readonly<Record<ExtensionKind, string>> = {
  plugin: "A bundle that can package commands, agents, skills, hooks, and MCP servers, installed from a plugin marketplace.",
  skill: "A folder with a SKILL.md file of instructions that Claude loads when a task matches its description.",
  agent: "A subagent with its own system prompt, tool access, and context window, defined in a markdown file.",
  hook: "A shell command that runs at a fixed point in a session, such as before or after a tool call.",
  "mcp-server": "A program that gives Claude Code extra tools and data through the Model Context Protocol.",
  command: "A reusable prompt saved as a markdown file and run inside a session as a slash command.",
  mod: "Proposed in the marketplace spec, not a confirmed Claude Code feature. These entries have no public code.",
};
