// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getIdeas, getIdeasCheckedAt, loadIdeas, loadIdeasFile } from "@/lib/ideas";

const EXPECTED_IDEA_SLUGS = [
  "claude-mod-guardrails",
  "claude-mod-git-sentinel",
  "claude-mod-context-compressor",
  "claude-mod-ui-telemetry",
  "claude-mod-mcp-bridge",
  "claude-mod-docker-sandbox",
  "claude-mod-agentic-eval",
  "claude-mod-voice-alerts",
] as const;

describe("the shipped ideas", () => {
  it("lists the spec ideas in file order with unique slugs", () => {
    const slugs = getIdeas().map((idea) => idea.slug);
    expect(slugs).toEqual([...EXPECTED_IDEA_SLUGS]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps the spec's colon event names verbatim", () => {
    const guardrails = getIdeas().find((idea) => idea.slug === "claude-mod-guardrails");
    expect(guardrails?.proposedEvents).toEqual(["command:pre_exec", "tool:pre_call"]);
    expect(guardrails?.specReference).toBe("Report 03, section 2.1");
  });

  it("describes every idea as a proposal with no dashes", () => {
    for (const idea of getIdeas()) {
      const text = [idea.name, idea.summary, ...idea.description].join(" ");
      expect(text, idea.slug).not.toMatch(/[–—]/);
      expect(idea.summary, idea.slug).toMatch(/^Would /);
      expect(idea.proposedEvents.length, idea.slug).toBeGreaterThan(0);
    }
  });

  it("exposes the date the spec reports were last read", () => {
    expect(getIdeasCheckedAt()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("loadIdeas with a data directory", () => {
  let dataDirectory: string;

  beforeEach(() => {
    dataDirectory = mkdtempSync(path.join(tmpdir(), "ideas-loader-"));
  });

  afterEach(() => {
    rmSync(dataDirectory, { recursive: true, force: true });
  });

  const idea = {
    slug: "one-idea",
    name: "One idea",
    summary: "Would do one thing.",
    description: ["A proposal."],
    proposedEvents: ["turn:complete"],
    specReference: "Report 03",
  };

  it("reads ideas in file order", () => {
    writeFileSync(
      path.join(dataDirectory, "ideas.json"),
      JSON.stringify({ version: 1, checkedAt: "2026-09-20", ideas: [{ ...idea, slug: "b-idea" }, { ...idea, slug: "a-idea" }] }),
    );
    expect(loadIdeas(dataDirectory).map((entry) => entry.slug)).toEqual(["b-idea", "a-idea"]);
  });

  it("rejects duplicate idea slugs and names the file", () => {
    writeFileSync(path.join(dataDirectory, "ideas.json"), JSON.stringify({ version: 1, checkedAt: "2026-09-20", ideas: [idea, idea] }));
    expect(() => loadIdeas(dataDirectory)).toThrow(/ideas\.json[\s\S]*duplicate slug in ideas/);
  });

  it("names the file and the issue path for an invalid idea", () => {
    writeFileSync(
      path.join(dataDirectory, "ideas.json"),
      JSON.stringify({ version: 1, checkedAt: "2026-09-20", ideas: [{ ...idea, summary: "" }] }),
    );
    expect(() => loadIdeas(dataDirectory)).toThrow(/ideas\.json[\s\S]*ideas\.0\.summary/);
  });

  it("reads checkedAt and rejects a file without a valid one", () => {
    writeFileSync(path.join(dataDirectory, "ideas.json"), JSON.stringify({ version: 1, checkedAt: "2026-09-20", ideas: [idea] }));
    expect(loadIdeasFile(dataDirectory).checkedAt).toBe("2026-09-20");
    writeFileSync(path.join(dataDirectory, "ideas.json"), JSON.stringify({ version: 1, ideas: [idea] }));
    expect(() => loadIdeasFile(dataDirectory)).toThrow(/ideas\.json[\s\S]*checkedAt/);
    writeFileSync(path.join(dataDirectory, "ideas.json"), JSON.stringify({ version: 1, checkedAt: "yesterday", ideas: [idea] }));
    expect(() => loadIdeasFile(dataDirectory)).toThrow(/checkedAt/);
  });

  it("names the file when it is missing or malformed", () => {
    expect(() => loadIdeas(dataDirectory)).toThrow(/ideas\.json: cannot read file/);
    writeFileSync(path.join(dataDirectory, "ideas.json"), "{");
    expect(() => loadIdeas(dataDirectory)).toThrow(/ideas\.json: not valid JSON/);
  });
});
