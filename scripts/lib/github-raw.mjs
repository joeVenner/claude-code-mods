// Pure helpers for the `--structure` check in verify-catalog.mjs. No network and no fs here, so
// vitest can import this file directly (src/lib/github-raw.test.ts).

export const RAW_HOST = "raw.githubusercontent.com";
export const PLUGIN_MANIFEST_PATH = ".claude-plugin/plugin.json";
export const MOD_HOOKS_MANIFEST_PATH = "hooks/hooks.json";
export const MAX_MANIFEST_BYTES = 256 * 1024;

// Only these characters may appear in a segment we turn into a raw URL. Percent signs are refused
// outright, so encoded traversal such as %2e%2e or %2F never reaches the fetch.
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;
// The whole URL is matched as text, before the URL parser, because `new URL()` silently collapses
// `..` segments and would hide the trick this check exists to reject. Credentials, ports and
// other hosts cannot match: after `github.com` only `/`, `?`, `#` or the end may follow.
const GITHUB_URL = /^https:\/\/github\.com(\/[^?#]*)?(?:[?#].*)?$/;

/**
 * @typedef {{ owner: string, repo: string, ref: string, pathSegments: readonly string[] }} GithubLocation
 * @typedef {{ ok: true, location: GithubLocation } | { ok: false, reason: string }} LocationResult
 */

function isSafeSegment(segment) {
  return SAFE_SEGMENT.test(segment) && segment !== "." && segment !== "..";
}

/**
 * Turns `https://github.com/<owner>/<repo>` or `.../tree/<ref>/<path>` into its parts.
 * A repository URL with no ref uses `HEAD`. The ref is one path segment, so a branch name that
 * contains a slash is not supported.
 * @param {string} repositoryUrl
 * @returns {LocationResult}
 */
export function parseGithubLocation(repositoryUrl) {
  const match = GITHUB_URL.exec(repositoryUrl);
  if (match === null) {
    return { ok: false, reason: "not a plain https://github.com URL (no credentials, port or other host)" };
  }
  const segments = (match[1] ?? "").split("/").slice(1);
  if (segments.at(-1) === "") segments.pop();
  if (segments.length < 2) {
    return { ok: false, reason: "expected /<owner>/<repo>" };
  }
  // A ref is one path segment. GitHub writes a branch named feature/x as tree/feature/x/..., which
  // cannot be told apart from a ref plus a path, so only an encoded slash in the ref can be named here.
  if (segments[2] === "tree" && /%2f/i.test(segments[3] ?? "")) {
    return {
      ok: false,
      reason: "the ref must be a single path segment; a branch name with a slash is not supported, link a tag, a commit or the default branch",
    };
  }
  const badSegment = segments.find((segment) => !isSafeSegment(segment));
  if (badSegment !== undefined) {
    return { ok: false, reason: `unsafe or empty path segment ${JSON.stringify(badSegment)}` };
  }
  const [owner, rawRepo, marker, ref, ...pathSegments] = segments;
  const repo = rawRepo.endsWith(".git") ? rawRepo.slice(0, -".git".length) : rawRepo;
  if (repo === "") {
    return { ok: false, reason: "empty repository name" };
  }
  if (marker === undefined) {
    return { ok: true, location: { owner, repo, ref: "HEAD", pathSegments: [] } };
  }
  if (marker !== "tree" || ref === undefined) {
    return { ok: false, reason: "only /<owner>/<repo> and /<owner>/<repo>/tree/<ref>/<path> are supported" };
  }
  return { ok: true, location: { owner, repo, ref, pathSegments } };
}

/**
 * Raw file URL for `relativeFile` inside the location.
 * @param {GithubLocation} location
 * @param {string} relativeFile fixed path written in this repository, never user input
 * @returns {string}
 */
export function rawUrlFor(location, relativeFile) {
  const parts = [location.owner, location.repo, location.ref, ...location.pathSegments, relativeFile];
  return `https://${RAW_HOST}/${parts.join("/")}`;
}

/**
 * Returns a problem description, or null when the text is a plugin manifest with a string name.
 * @param {string} text
 * @returns {string | null}
 */
export function pluginManifestProblem(text) {
  const parsed = parseJsonObject(text);
  if ("problem" in parsed) return parsed.problem;
  return typeof parsed.value.name === "string" && parsed.value.name !== ""
    ? null
    : 'missing a string "name"';
}

/**
 * Returns a problem description, or null when the text is a hooks manifest with a `modules` array.
 * @param {string} text
 * @returns {string | null}
 */
export function modHooksManifestProblem(text) {
  const parsed = parseJsonObject(text);
  if ("problem" in parsed) return parsed.problem;
  return Array.isArray(parsed.value.modules) ? null : 'missing a "modules" array';
}

function parseJsonObject(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return { problem: "not valid JSON" };
  }
  const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
  return isObject ? { value } : { problem: "not a JSON object" };
}

/**
 * The files an entry of this kind must have at its repository location, with how to judge each.
 * Kinds other than plugin and mod have no fixed layout, so they have no structure check.
 * @param {string} kind
 * @returns {readonly { file: string, problemOf: (text: string) => string | null }[]}
 */
export function structureChecksFor(kind) {
  const pluginCheck = { file: PLUGIN_MANIFEST_PATH, problemOf: pluginManifestProblem };
  if (kind === "plugin") return [pluginCheck];
  if (kind === "mod") return [pluginCheck, { file: MOD_HOOKS_MANIFEST_PATH, problemOf: modHooksManifestProblem }];
  return [];
}
