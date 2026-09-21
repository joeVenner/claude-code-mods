import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The workflows cannot run here, so these tests pin the properties that keep them safe when a fork's
 * pull request runs them. They read the files as text: no YAML parser is a direct dependency.
 */
function readRepositoryFile(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const VALIDATE_TEXT = readRepositoryFile(".github/workflows/validate.yml");
const REVERIFY_TEXT = readRepositoryFile(".github/workflows/reverify.yml");
const CODEOWNERS_TEXT = readRepositoryFile(".github/CODEOWNERS");

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/** Returns the text of every `run:` step, whether inline or a `|` block, without the comments around it. */
function extractRunBlocks(lines: readonly string[]): readonly string[] {
  const blocks: string[] = [];
  lines.forEach((line, index) => {
    const match = /^(\s*)(?:- )?run:\s*(.*)$/.exec(line);
    if (match === null) return;
    const [, , inlineValue] = match;
    if (inlineValue !== "|" && inlineValue !== ">") {
      blocks.push(inlineValue);
      return;
    }
    const runIndent = indentOf(line);
    const body: string[] = [];
    for (const next of lines.slice(index + 1)) {
      if (next.trim() !== "" && indentOf(next) <= runIndent) break;
      body.push(next);
    }
    blocks.push(body.join("\n"));
  });
  return blocks;
}

function codeOf(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");
}

/** Text of one job, from its header to the next job header (or the end of the file). */
function jobText(text: string, jobName: string): string {
  const start = text.indexOf(`\n  ${jobName}:\n`);
  expect(start, `job ${jobName} exists`).toBeGreaterThanOrEqual(0);
  const rest = text.slice(start + 1);
  const next = rest.slice(1).search(/^ {2}[a-z][a-z-]*:\s*$/m);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

describe("workflow text helpers", () => {
  it("finds an unsafe expression in both inline and block run steps", () => {
    const unsafe = [
      "steps:",
      "  - run: echo ${{ github.event.pull_request.title }}",
      "  - name: block",
      "    run: |",
      "      echo one",
      "      echo ${{ github.head_ref }}",
      "  - name: next",
      "    run: echo safe",
    ];
    const blocks = extractRunBlocks(unsafe);
    expect(blocks).toHaveLength(3);
    expect(blocks.filter((block) => block.includes("${{"))).toHaveLength(2);
    expect(blocks[2]).toBe("echo safe");
  });

  it("isolates one job from the jobs around it", () => {
    const text = "jobs:\n  first:\n    a: 1\n  second:\n    b: 2\n  third:\n    c: 3\n";
    expect(jobText(text, "second")).toContain("b: 2");
    expect(jobText(text, "second")).not.toContain("c: 3");
    expect(jobText(text, "third")).toContain("c: 3");
  });
});

describe.each([
  ["validate.yml", VALIDATE_TEXT],
  ["reverify.yml", REVERIFY_TEXT],
])("%s safety properties", (_name, text) => {
  it("never uses pull_request_target and grants read access to contents only", () => {
    expect(codeOf(text)).not.toContain("pull_request_target");
    expect(text).toMatch(/^permissions:\n {2}contents: read\n/m);
    expect(codeOf(text)).not.toMatch(/:\s*write\b/);
  });

  it("uses no secrets", () => {
    expect(codeOf(text)).not.toMatch(/secrets\./);
  });

  it("sets a timeout on every job", () => {
    const jobsSection = text.slice(text.indexOf("\njobs:"));
    const jobNames = jobsSection.match(/^ {2}[a-z][a-z-]*:\s*$/gm) ?? [];
    expect(jobNames.length).toBeGreaterThanOrEqual(1);
    expect((jobsSection.match(/^ {4}timeout-minutes: \d+$/gm) ?? []).length).toBe(jobNames.length);
  });

  it("pins every action to a 40-character commit SHA with the tag in a trailing comment", () => {
    const usesLines = codeOf(text)
      .split("\n")
      .filter((line) => /\buses:/.test(line));
    expect(usesLines.length).toBeGreaterThanOrEqual(2);
    for (const line of usesLines) {
      expect(line).toMatch(/uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
    }
  });

  it("checks out without persisting credentials", () => {
    const checkoutCount = (text.match(/uses: actions\/checkout@/g) ?? []).length;
    expect(checkoutCount).toBeGreaterThanOrEqual(1);
    expect((text.match(/persist-credentials: false/g) ?? []).length).toBe(checkoutCount);
  });

  it("puts no expression from the event or any other context inside a run block", () => {
    const runBlocks = extractRunBlocks(text.split("\n"));
    expect(runBlocks.length).toBeGreaterThanOrEqual(3);
    for (const block of runBlocks) {
      expect(block).not.toContain("${{");
      expect(block).not.toMatch(/github\.event/);
    }
  });

  it("installs with npm ci and without dependency install scripts", () => {
    const installs = extractRunBlocks(text.split("\n")).filter((block) => block.startsWith("npm ci"));
    expect(installs.length).toBeGreaterThanOrEqual(1);
    for (const install of installs) {
      expect(install).toBe("npm ci --ignore-scripts");
    }
  });
});

describe("validate workflow", () => {
  it("triggers on pull_request and pushes to main, and explains why not pull_request_target", () => {
    const code = codeOf(VALIDATE_TEXT);
    expect(code).toMatch(/^on:\n {2}pull_request:/m);
    expect(code).toMatch(/push:\n\s+branches: \[main\]/);
    expect(VALIDATE_TEXT).toMatch(/#.*never pull_request_target/);
  });

  it("cancels superseded pull request runs with a concurrency group", () => {
    expect(VALIDATE_TEXT).toMatch(
      /^concurrency:\n {2}group: .+\n {2}cancel-in-progress: .+github\.event_name == 'pull_request'/m,
    );
  });

  it("runs the full check job in the required order", () => {
    const checkJob = jobText(VALIDATE_TEXT, "check");
    const commands = ["npm ci --ignore-scripts", "npm run typecheck", "npm run lint", "npm test", "npm run build"];
    const positions = commands.map((command) => checkJob.indexOf(`run: ${command}`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(checkJob).toMatch(/node-version: 22/);
    expect(checkJob).toMatch(/cache: npm/);
  });

  it("finds submissions with NUL separated names, no rename detection and the base ref from env", () => {
    const submission = jobText(VALIDATE_TEXT, "submission");
    expect(submission).toMatch(/if: github\.event_name == 'pull_request'/);
    expect(submission).toMatch(/env:\n\s+BASE_REF: \$\{\{ github\.base_ref \}\}/);
    expect(submission).toContain("git diff -z --name-only --no-renames --diff-filter=AM");
    expect(submission).toContain('"origin/${BASE_REF}...HEAD"');
    expect(submission).toContain("'src/data/community/*.json'");
    expect(submission).toContain("xargs -0 npm run catalog:verify -- --only");
    expect(submission).toContain("xargs -0 npm run catalog:structure -- --only");
    expect(submission).toContain("fetch-depth: 0");
  });

  it("has a path guard that fails when a submission touches anything outside the community folder", () => {
    const guard = jobText(VALIDATE_TEXT, "path-guard");
    expect(guard).toContain("git diff -z --name-only --no-renames");
    expect(guard).toContain("src/data/community/*) touches_community=true");
    expect(guard).toContain("exit 1");
    expect(guard).toMatch(/Please split it/);
    expect(guard).toContain("fetch-depth: 0");
    expect(guard).toMatch(/env:\n\s+BASE_REF: \$\{\{ github\.base_ref \}\}/);
  });

  it("skips the path guard for the owner, members and collaborators with a job level condition", () => {
    const guard = jobText(VALIDATE_TEXT, "path-guard");
    expect(guard).toMatch(/^ {4}if: github\.event_name == 'pull_request' && !contains\(/m);
    for (const association of ["OWNER", "MEMBER", "COLLABORATOR"]) {
      expect(guard).toContain(`"${association}"`);
    }
    expect(guard).toContain("github.event.pull_request.author_association");
  });

  it("says the guard is advisory and names CODEOWNERS and a branch ruleset as the real protection", () => {
    expect(VALIDATE_TEXT).toMatch(/# Advisory only\./);
    expect(VALIDATE_TEXT).toMatch(/CODEOWNERS plus a\s+# branch ruleset/);
  });
});

describe("reverify workflow", () => {
  it("runs weekly and on demand, never on pull requests or pushes", () => {
    const code = codeOf(REVERIFY_TEXT);
    expect(code).toMatch(/^on:\n {2}schedule:\n {4}- cron: "[^"]+"\n {2}workflow_dispatch:/m);
    expect(code).not.toMatch(/pull_request|push:/);
  });

  it("checks every URL and every manifest on all entries, not just changed files", () => {
    const commands = extractRunBlocks(REVERIFY_TEXT.split("\n"));
    expect(commands).toContain("npm run catalog:verify");
    expect(commands).toContain("npm run catalog:structure");
    expect(REVERIFY_TEXT).not.toContain("--only");
  });

  it("runs the manifest check even when the link check failed, so one run reports both", () => {
    expect(REVERIFY_TEXT).toMatch(/if: \$\{\{ !cancelled\(\) \}\}\n\s+run: npm run catalog:structure/);
  });

  it("uses the same pinned action versions as the validate workflow", () => {
    const pins = (text: string): readonly string[] => [...new Set(text.match(/uses: \S+@[0-9a-f]{40}/g) ?? [])].sort();
    expect(pins(REVERIFY_TEXT)).toEqual(pins(VALIDATE_TEXT));
  });
});

describe("CODEOWNERS", () => {
  const rules = CODEOWNERS_TEXT.split("\n").filter((line) => line.trim() !== "" && !line.startsWith("#"));

  it("owns everything, and each sensitive path explicitly", () => {
    expect(rules[0]).toBe("* @joeVenner");
    for (const owned of ["/src/data/", "/src/lib/", "/scripts/", "/.github/", "/package.json", "/package-lock.json"]) {
      expect(rules).toContain(`${owned} @joeVenner`);
    }
  });

  it("says it only takes effect when a branch ruleset requires code owner review", () => {
    expect(CODEOWNERS_TEXT).toMatch(/only takes effect when the repository enables "Require review from Code Owners"/);
  });
});
