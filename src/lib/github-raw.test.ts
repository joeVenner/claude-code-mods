import { describe, expect, it } from "vitest";
import {
  modHooksManifestProblem,
  parseGithubLocation,
  pluginManifestProblem,
  rawUrlFor,
  structureChecksFor,
} from "../../scripts/lib/github-raw.mjs";

function parseOk(url: string) {
  const result = parseGithubLocation(url);
  if (!result.ok) throw new Error(`expected ${url} to parse: ${result.reason}`);
  return result.location;
}

describe("parseGithubLocation", () => {
  it("parses a repository root with the HEAD ref", () => {
    expect(parseOk("https://github.com/owner/repo")).toEqual({
      owner: "owner",
      repo: "repo",
      ref: "HEAD",
      pathSegments: [],
    });
  });

  it("parses a tree URL into ref and path", () => {
    expect(parseOk("https://github.com/anthropics/claude-code/tree/main/mods/diff")).toEqual({
      owner: "anthropics",
      repo: "claude-code",
      ref: "main",
      pathSegments: ["mods", "diff"],
    });
  });

  it("accepts a trailing slash, a query, a fragment and a .git suffix", () => {
    expect(parseOk("https://github.com/o/r/tree/main/p/").pathSegments).toEqual(["p"]);
    expect(parseOk("https://github.com/o/r?tab=readme#top").repo).toBe("r");
    expect(parseOk("https://github.com/o/r.git").repo).toBe("r");
  });

  it("accepts a tree URL that names only a ref", () => {
    expect(parseOk("https://github.com/o/r/tree/v1.2.3").pathSegments).toEqual([]);
  });

  it.each([
    ["dot-dot in the path", "https://github.com/o/r/tree/main/../other"],
    ["dot-dot as the ref", "https://github.com/o/r/tree/../x"],
    ["single dot segment", "https://github.com/o/r/tree/main/./x"],
    ["encoded dot-dot", "https://github.com/o/r/tree/main/%2e%2e/x"],
    ["encoded slash", "https://github.com/o/r/tree/main/a%2Fb"],
    ["empty segment in the middle", "https://github.com/o/r/tree/main//x"],
    ["backslash", "https://github.com/o/r/tree/main/a\\b"],
    ["owner only", "https://github.com/owner"],
    ["host only", "https://github.com"],
    ["blob URL", "https://github.com/o/r/blob/main/README.md"],
    ["issues URL", "https://github.com/o/r/issues/1"],
    ["tree with no ref", "https://github.com/o/r/tree"],
    ["credentials", "https://user:pass@github.com/o/r"],
    ["userinfo phishing form", "https://github.com@evil.example/o/r"],
    ["custom port", "https://github.com:8443/o/r"],
    ["other host", "https://gitlab.com/o/r"],
    ["look-alike host", "https://github.com.evil.example/o/r"],
    ["plain http", "http://github.com/o/r"],
    ["raw host", "https://raw.githubusercontent.com/o/r/main/x"],
    ["empty string", ""],
  ])("rejects %s", (_label, url) => {
    expect(parseGithubLocation(url).ok).toBe(false);
  });

  it("rejects a ref that hides a slash, and says a ref must be one segment", () => {
    const result = parseGithubLocation("https://github.com/o/r/tree/feature%2Fbranch/mods/x");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/single path segment/);
  });

  it("says why a URL was rejected", () => {
    const result = parseGithubLocation("https://github.com/o/r/tree/main/../x");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("..");
  });
});

describe("rawUrlFor", () => {
  it("builds a raw.githubusercontent.com URL for a file inside the location", () => {
    const location = parseOk("https://github.com/anthropics/claude-code/tree/main/mods/diff");
    expect(rawUrlFor(location, ".claude-plugin/plugin.json")).toBe(
      "https://raw.githubusercontent.com/anthropics/claude-code/main/mods/diff/.claude-plugin/plugin.json",
    );
  });

  it("puts the file directly after the ref for a repository root", () => {
    expect(rawUrlFor(parseOk("https://github.com/o/r"), "hooks/hooks.json")).toBe(
      "https://raw.githubusercontent.com/o/r/HEAD/hooks/hooks.json",
    );
  });
});

describe("manifest checks", () => {
  it("accepts a plugin manifest with a string name", () => {
    expect(pluginManifestProblem('{"name":"diff","version":"0.1.0"}')).toBeNull();
  });

  it.each([
    ["not JSON", "{ nope", "not valid JSON"],
    ["an array", "[]", "not a JSON object"],
    ["null", "null", "not a JSON object"],
    ["no name", "{}", 'missing a string "name"'],
    ["a numeric name", '{"name":3}', 'missing a string "name"'],
    ["an empty name", '{"name":""}', 'missing a string "name"'],
  ])("rejects a plugin manifest that is %s", (_label, text, problem) => {
    expect(pluginManifestProblem(text)).toBe(problem);
  });

  it("accepts a hooks manifest with a modules array, including an empty one", () => {
    expect(modHooksManifestProblem('{"modules":["./register.ts"]}')).toBeNull();
    expect(modHooksManifestProblem('{"modules":[]}')).toBeNull();
  });

  it.each([
    ["no modules", '{"hooks":{}}'],
    ["modules as a string", '{"modules":"./register.ts"}'],
    ["not JSON", "<html>"],
  ])("rejects a hooks manifest with %s", (_label, text) => {
    expect(modHooksManifestProblem(text)).not.toBeNull();
  });
});

describe("structureChecksFor", () => {
  it("requires plugin.json for plugins, plus hooks.json for mods", () => {
    expect(structureChecksFor("plugin").map((check) => check.file)).toEqual([".claude-plugin/plugin.json"]);
    expect(structureChecksFor("mod").map((check) => check.file)).toEqual([
      ".claude-plugin/plugin.json",
      "hooks/hooks.json",
    ]);
  });

  it.each(["skill", "agent", "hook", "mcp-server", "command", "unknown"])("checks nothing for %s", (kind) => {
    expect(structureChecksFor(kind)).toEqual([]);
  });
});
