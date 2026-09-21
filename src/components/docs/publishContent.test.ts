import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { communityRuleProblems } from "@/lib/catalog";
import { extensionSchema, guideSectionSchema } from "@/lib/types";
import {
  CHECK_COMMANDS,
  COMMUNITY_FILE_PATTERN,
  COMMUNITY_LABEL,
  ENTRY_FIELD_DOCS,
  ENTRY_FIELD_GROUPS,
  EXAMPLE_ENTRY,
  EXAMPLE_ENTRY_JSON,
  EXAMPLE_GUIDE,
  EXAMPLE_GUIDE_JSON,
  LICENSE_OPEN_ITEM,
  PLUGIN_DOCS_LINKS,
  PUBLISH_STEPS,
  RULES_FRAMING,
  SUBMISSION_RULES,
} from "./publishContent";
import { DASH_PATTERN } from "./testSupport";

const CONTRIBUTING_TEXT = readFileSync(path.join(process.cwd(), "CONTRIBUTING.md"), "utf8");

describe("publish content", () => {
  it("documents exactly the fields of the extension schema", () => {
    expect(Object.keys(ENTRY_FIELD_DOCS).sort()).toEqual(Object.keys(extensionSchema.shape).sort());
  });

  it("documents the fields added for real mods", () => {
    for (const field of ["availability", "notice", "details", "guide"] as const) {
      expect(ENTRY_FIELD_DOCS[field].description.length).toBeGreaterThan(0);
    }
  });

  it("places every field in exactly one group", () => {
    const grouped = ENTRY_FIELD_GROUPS.flatMap((group) => group.fields);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(Object.keys(ENTRY_FIELD_DOCS).sort());
  });

  it("gives every field a non-empty type and description", () => {
    for (const doc of Object.values(ENTRY_FIELD_DOCS)) {
      expect(doc.type.length).toBeGreaterThan(0);
      expect(doc.description.length).toBeGreaterThan(0);
    }
  });

  it("states the submission rule for every field submitters cannot set freely", () => {
    expect(ENTRY_FIELD_DOCS.publisher.submissionRule).toContain("community");
    expect(ENTRY_FIELD_DOCS.stars.submissionRule).toContain("null");
    expect(ENTRY_FIELD_DOCS.isFeatured.submissionRule).toContain("false");
    expect(ENTRY_FIELD_DOCS.availability.submissionRule).toContain("built-in");
    expect(ENTRY_FIELD_DOCS.guide.submissionRule).toMatch(/set up.*setup.*download/);
    expect(ENTRY_FIELD_DOCS.installCommands.submissionRule).toMatch(/200 characters/);
    expect(ENTRY_FIELD_DOCS.details.submissionRule).toMatch(/isCommand true/);
    expect(ENTRY_FIELD_DOCS.verification.submissionRule).toMatch(/future/);
    expect(ENTRY_FIELD_DOCS.slug.submissionRule).toMatch(/too similar/);
  });

  it("does not describe a concept status that no longer exists", () => {
    const text = JSON.stringify(ENTRY_FIELD_DOCS);
    expect(text).not.toMatch(/concept/i);
    expect(text).not.toMatch(DASH_PATTERN);
  });
});

describe("example entry", () => {
  it("is valid against the real schema and follows every community rule", () => {
    expect(extensionSchema.safeParse(EXAMPLE_ENTRY).success).toBe(true);
    expect(communityRuleProblems(EXAMPLE_ENTRY, `${EXAMPLE_ENTRY.slug}.json`)).toEqual([]);
  });

  it("is fictional, source-only and cannot claim stars or featuring", () => {
    expect(EXAMPLE_ENTRY.slug).toBe("example-format-on-save");
    expect(EXAMPLE_ENTRY.publisher.kind).toBe("community");
    expect(EXAMPLE_ENTRY.availability).toBe("source-only");
    expect(EXAMPLE_ENTRY.stars).toBeNull();
    expect(EXAMPLE_ENTRY.isFeatured).toBe(false);
    expect(JSON.parse(EXAMPLE_ENTRY_JSON)).toEqual(EXAMPLE_ENTRY);
  });

  it("is rejected by the schema if it is made installable without a command", () => {
    const result = extensionSchema.safeParse({ ...EXAMPLE_ENTRY, availability: "installable" });
    expect(result.success).toBe(false);
  });

  it("breaks the community rules when a submitter claims stars, featuring or built-in", () => {
    const cheating = {
      ...EXAMPLE_ENTRY,
      isFeatured: true,
      stars: { count: 5, capturedAt: "2026-01-15" },
      availability: "built-in" as const,
    };
    expect(communityRuleProblems(cheating, `${EXAMPLE_ENTRY.slug}.json`)).toHaveLength(3);
  });
});

describe("example guide", () => {
  it("is valid against the real guide schema and has overview, setup and download", () => {
    expect(z.array(guideSectionSchema).min(1).safeParse(EXAMPLE_GUIDE).success).toBe(true);
    expect(EXAMPLE_GUIDE.map((section) => section.title)).toEqual(["Overview", "Setup", "Download"]);
    expect(JSON.parse(EXAMPLE_GUIDE_JSON)).toEqual(EXAMPLE_GUIDE);
  });

  it("turns the example into a valid mod entry, and a mod without a guide is rejected", () => {
    const mod = { ...EXAMPLE_ENTRY, kind: "mod" as const, guide: [...EXAMPLE_GUIDE] };
    expect(extensionSchema.safeParse(mod).success).toBe(true);
    expect(extensionSchema.safeParse({ ...mod, guide: [] }).success).toBe(false);
  });
});

describe("publish steps and rules", () => {
  it("names each step with a verb and never numbers it", () => {
    for (const step of PUBLISH_STEPS) {
      expect(step.title).not.toMatch(/^(step|phase|stage)\s*\d/i);
      expect(step.title).not.toMatch(DASH_PATTERN);
    }
    expect(PUBLISH_STEPS.map((step) => step.title)).toEqual([
      "Fork and clone the repository",
      "Add one file",
      "Run the checks locally",
      "Open a pull request",
      "Wait for CI",
      "A maintainer reviews and merges",
      "The site rebuilds",
    ]);
  });

  it("lists the rules a submission cannot bypass", () => {
    const text = SUBMISSION_RULES.map((rule) => rule.rule).join("\n");
    for (const expected of [
      'publisher.kind is "community"',
      "isFeatured is false",
      "stars is null",
      "github.com",
      "never built-in",
      ".claude-plugin/plugin.json",
      "hooks/hooks.json",
      "modules array",
      "allowlisted host",
    ]) {
      expect(text).toContain(expected);
    }
    expect(new Set(SUBMISSION_RULES.map((rule) => rule.id)).size).toBe(SUBMISSION_RULES.length);
  });

  it("uses the same local check commands as CONTRIBUTING.md", () => {
    expect(CHECK_COMMANDS).toEqual([
      "npm test",
      "npm run catalog:verify -- --only src/data/community/<slug>.json",
      "npm run catalog:structure -- --only src/data/community/<slug>.json",
    ]);
    for (const command of CHECK_COMMANDS) {
      expect(CONTRIBUTING_TEXT).toContain(command);
    }
    expect(CONTRIBUTING_TEXT).toContain(COMMUNITY_FILE_PATTERN);
  });

  it("keeps the example entry in CONTRIBUTING.md in step with the one on the page", () => {
    expect(CONTRIBUTING_TEXT).toContain(EXAMPLE_ENTRY_JSON);
    expect(CONTRIBUTING_TEXT).toContain(EXAMPLE_GUIDE_JSON);
  });

  it("says in CONTRIBUTING.md that listing is not review", () => {
    expect(CONTRIBUTING_TEXT).toContain("Listing is not review.");
  });

  it("uses the reworded rules heading and framing in CONTRIBUTING.md", () => {
    expect(CONTRIBUTING_TEXT).toContain("## Rules every submission must meet");
    expect(CONTRIBUTING_TEXT).not.toMatch(/cannot bypass/i);
    for (const paragraph of RULES_FRAMING) {
      expect(CONTRIBUTING_TEXT).toContain(paragraph);
    }
    expect(CONTRIBUTING_TEXT).toContain(`"${COMMUNITY_LABEL}"`);
  });

  it("lists every submission rule in CONTRIBUTING.md, ignoring code formatting", () => {
    const plain = CONTRIBUTING_TEXT.replaceAll("`", "");
    for (const rule of SUBMISSION_RULES) {
      expect(plain, rule.id).toContain(rule.rule.replaceAll("`", ""));
    }
  });

  it("states the license as an open item in CONTRIBUTING.md without choosing one", () => {
    expect(CONTRIBUTING_TEXT).toContain(LICENSE_OPEN_ITEM);
    expect(LICENSE_OPEN_ITEM).not.toMatch(/\b(MIT|Apache|GPL|BSD|CC0|CC-BY)\b/);
  });

  it("keeps every command in the example guide and entry inside the allowed command forms", () => {
    const allowed = [
      /^\/plugin marketplace add [\w.-]+\/[\w.-]+$/,
      /^\/plugin install [\w.-]+@[\w.-]+$/,
      /^claude --plugin-dir \S+$/,
      /^git clone https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/,
    ];
    const commands = [
      ...EXAMPLE_ENTRY.installCommands,
      ...EXAMPLE_ENTRY.details.filter((detail) => detail.isCommand).map((detail) => detail.value),
      ...EXAMPLE_GUIDE.flatMap((section) => section.commands),
    ];
    expect(commands.length).toBeGreaterThan(0);
    for (const command of commands) {
      expect(command).toMatch(/^[\x20-\x7e]{1,200}$/);
      expect(allowed.some((form) => form.test(command)), command).toBe(true);
    }
  });

  it("does not offer a publish API and links only real plugin docs", () => {
    expect(JSON.stringify(PUBLISH_STEPS)).not.toContain("/v1/");
    for (const link of PLUGIN_DOCS_LINKS) {
      expect(link.url).toMatch(/^https:\/\/code\.claude\.com\/docs\/en\//);
    }
  });
});
