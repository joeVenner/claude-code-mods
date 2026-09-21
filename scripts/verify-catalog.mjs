#!/usr/bin/env node
// Checks the catalog data files against the network. Sequential with a delay between requests so
// we do not hammer GitHub or the docs host.
//
//   node scripts/verify-catalog.mjs                      every URL in every data file returns HTTP 200
//   node scripts/verify-catalog.mjs --structure          plugin and mod entries have their manifests
//   node scripts/verify-catalog.mjs --only <path|slug>...  check only these files (or the files defining
//                                                        these slugs), for CI on a pull request
//
// Data files: src/data/catalog.json plus every src/data/community/*.json (one extension per file).
// For --only, pass files that still exist (for example `git diff --diff-filter=AM --name-only`).

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALLOWED_CATALOG_HOSTS } from "./lib/hosts.mjs";
import {
  MAX_MANIFEST_BYTES,
  PLUGIN_MANIFEST_PATH,
  parseGithubLocation,
  rawUrlFor,
  RAW_HOST,
  structureChecksFor,
} from "./lib/github-raw.mjs";

const DATA_DIRECTORY = fileURLToPath(new URL("../src/data/", import.meta.url));
const CATALOG_PATH = path.join(DATA_DIRECTORY, "catalog.json");
const COMMUNITY_DIRECTORY = path.join(DATA_DIRECTORY, "community");
const REQUEST_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT = "claude-code-mods-catalog-verify (link check)";
const MAX_REDIRECTS = 5;
const ALLOWED_HOSTS = new Set(ALLOWED_CATALOG_HOSTS);
// raw.githubusercontent.com is used only for structure checks, and only for URLs this script derives
// from a github.com repositoryUrl (see scripts/lib/github-raw.mjs). It is still https with no
// credentials, and it is deliberately NOT in ALLOWED_HOSTS, so a URL written in a data file can never
// make the link check fetch it.
const STRUCTURE_HOSTS = new Set([...ALLOWED_HOSTS, RAW_HOST]);

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function describeError(error) {
  return error instanceof Error ? error.message : String(error);
}

function relativeToProject(filePath) {
  return path.relative(process.cwd(), filePath) || filePath;
}

/**
 * Reads every data file. Returns one source per file with the entries it defines.
 * A file that cannot be read or parsed becomes a failure instead of aborting the whole run.
 */
async function loadSources() {
  const sources = [];
  const failures = [];
  const readSource = async (filePath, toEntries) => {
    try {
      const value = JSON.parse(await readFile(filePath, "utf8"));
      sources.push({ filePath, entries: toEntries(value) });
    } catch (error) {
      failures.push(`${relativeToProject(filePath)}: cannot read (${describeError(error)})`);
    }
  };

  await readSource(CATALOG_PATH, (catalog) => {
    if (!Array.isArray(catalog?.extensions)) throw new Error('missing an "extensions" array');
    return catalog.extensions;
  });

  let communityNames = [];
  try {
    communityNames = (await readdir(COMMUNITY_DIRECTORY)).filter((name) => name.endsWith(".json")).sort();
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  for (const name of communityNames) {
    await readSource(path.join(COMMUNITY_DIRECTORY, name), (extension) => [extension]);
  }
  return { sources, failures };
}

/**
 * Resolves `--only` values to items. A file path selects every entry in that file; a slug selects
 * just that entry. Values that match nothing are failures.
 */
function selectItems(items, onlyValues) {
  const selected = new Set();
  const failures = [];
  for (const value of onlyValues) {
    const resolvedPath = path.resolve(value);
    const matches = items.filter((item) => item.filePath === resolvedPath);
    const slugMatches = items.filter((item) => item.entry?.slug === value);
    const found = matches.length > 0 ? matches : slugMatches;
    if (found.length === 0) {
      failures.push(`--only ${value}: not a data file or a known slug`);
    }
    for (const item of found) selected.add(item);
  }
  return { selected: [...selected], failures };
}

/** Collects every URL with the entries that reference it, so each URL is fetched once. */
function collectUrls(entries) {
  const referencesByUrl = new Map();
  const add = (url, slug, field) => {
    if (typeof url !== "string") return;
    const references = referencesByUrl.get(url) ?? [];
    references.push(`${slug}:${field}`);
    referencesByUrl.set(url, references);
  };
  for (const entry of entries) {
    const slug = entry?.slug ?? "(no slug)";
    add(entry?.verification?.sourceUrl, slug, "sourceUrl");
    add(entry?.repositoryUrl, slug, "repositoryUrl");
    add(entry?.publisher?.url, slug, "publisher.url");
    for (const link of entry?.links ?? []) add(link?.url, slug, `link(${link?.label})`);
  }
  return referencesByUrl;
}

function assertAllowedUrl(value, allowedHosts) {
  const url = new URL(value);
  const isAllowed =
    url.protocol === "https:" && !url.username && !url.password && !url.port && allowedHosts.has(url.hostname);
  if (!isAllowed) throw new Error(`refusing to fetch ${value}: not an https URL on an allowed host`);
  return url;
}

/** Follows redirects by hand so every hop is checked against the allowlist, not just the first URL. */
async function requestWithSafeRedirects(url, method, allowedHosts) {
  let current = assertAllowedUrl(url, allowedHosts);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "user-agent": USER_AGENT },
    });
    const location = response.headers.get("location");
    const isRedirect = response.status >= 300 && response.status < 400 && location !== null;
    if (!isRedirect) return response;
    await response.body?.cancel();
    current = assertAllowedUrl(new URL(location, current).href, allowedHosts);
  }
  throw new Error(`more than ${MAX_REDIRECTS} redirects for ${url}`);
}

async function fetchStatus(url) {
  const headResponse = await requestWithSafeRedirects(url, "HEAD", ALLOWED_HOSTS);
  if (headResponse.status !== 405 && headResponse.status !== 501) {
    return headResponse.status;
  }
  // Some hosts reject HEAD; fall back to GET and discard the body.
  const getResponse = await requestWithSafeRedirects(url, "GET", ALLOWED_HOSTS);
  await getResponse.body?.cancel();
  return getResponse.status;
}

/** Reads at most `maxBytes` of the body, so a hostile or huge file cannot fill memory. */
async function readCappedText(response, maxBytes) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error(`file is larger than ${maxBytes} bytes`);
    }
    text += decoder.decode(value, { stream: true });
  }
}

async function runLinkCheck(entries) {
  const referencesByUrl = collectUrls(entries);
  const failures = [];
  let checkedCount = 0;
  for (const [url, references] of referencesByUrl) {
    let outcome;
    try {
      outcome = String(await fetchStatus(url));
    } catch (error) {
      outcome = `error (${describeError(error)})`;
    }
    checkedCount += 1;
    if (outcome === "200") {
      console.log(`200 ${url}`);
    } else {
      console.error(`${outcome} ${url}\n    used by: ${references.join(", ")}`);
      failures.push(url);
    }
    await sleep(REQUEST_DELAY_MS);
  }
  console.log(`\nChecked ${checkedCount} unique URLs for ${entries.length} entries.`);
  return failures;
}

/** Fetches one manifest and returns a problem description, or null when it passes its check. */
async function manifestProblem(rawUrl, problemOf) {
  const response = await requestWithSafeRedirects(rawUrl, "GET", STRUCTURE_HOSTS);
  if (response.status !== 200) {
    await response.body?.cancel();
    return `HTTP ${response.status}`;
  }
  return problemOf(await readCappedText(response, MAX_MANIFEST_BYTES));
}

/**
 * `catalog.json` is curated by maintainers who read each entry. Claude Code treats plugin.json as
 * optional (a plugin can be auto-discovered from its folders), so a missing plugin.json there is a
 * warning. A community file gets no such allowance: submissions must ship the manifest.
 */
async function runStructureCheck(items) {
  const failures = [];
  let checkedCount = 0;
  for (const { entry, isCurated } of items) {
    const checks = structureChecksFor(entry?.kind);
    if (checks.length === 0) continue;
    const slug = entry?.slug ?? "(no slug)";
    const located = parseGithubLocation(String(entry?.repositoryUrl));
    if (!located.ok) {
      console.error(`FAIL ${slug}: repositoryUrl ${located.reason}`);
      failures.push(slug);
      continue;
    }
    for (const { file, problemOf } of checks) {
      const rawUrl = rawUrlFor(located.location, file);
      let problem;
      try {
        problem = await manifestProblem(rawUrl, problemOf);
      } catch (error) {
        problem = `error (${describeError(error)})`;
      }
      checkedCount += 1;
      const isOptionalManifestMissing = isCurated && file === PLUGIN_MANIFEST_PATH && problem === "HTTP 404";
      if (problem === null) {
        console.log(`ok   ${slug}: ${file}`);
      } else if (isOptionalManifestMissing) {
        console.warn(`warn ${slug}: ${file} not found (optional for maintainer-curated entries)\n    ${rawUrl}`);
      } else {
        const refHint =
          problem === "HTTP 404"
            ? "\n    If the branch name contains a slash, this URL form cannot express it: link a tag, a commit or the default branch."
            : "";
        console.error(`FAIL ${slug}: ${file} ${problem}\n    ${rawUrl}${refHint}`);
        failures.push(`${slug}:${file}`);
      }
      await sleep(REQUEST_DELAY_MS);
    }
  }
  console.log(`\nChecked ${checkedCount} manifest file(s) for ${items.length} entries.`);
  return failures;
}

function parseArguments(argv) {
  const isStructure = argv.includes("--structure");
  const onlyIndex = argv.indexOf("--only");
  const onlyValues = [];
  if (onlyIndex !== -1) {
    for (const value of argv.slice(onlyIndex + 1)) {
      if (value.startsWith("--")) break;
      onlyValues.push(value);
    }
    if (onlyValues.length === 0) throw new Error("--only needs at least one file path or slug");
  }
  return { isStructure, hasOnly: onlyIndex !== -1, onlyValues };
}

async function main() {
  const { isStructure, hasOnly, onlyValues } = parseArguments(process.argv.slice(2));
  const { sources, failures: loadFailures } = await loadSources();
  for (const failure of loadFailures) console.error(failure);

  const allItems = sources.flatMap((source) =>
    source.entries.map((entry) => ({ entry, filePath: source.filePath, isCurated: source.filePath === CATALOG_PATH })),
  );
  let items = allItems;
  const selectionFailures = [];
  if (hasOnly) {
    const selection = selectItems(allItems, onlyValues);
    items = selection.selected;
    selectionFailures.push(...selection.failures);
    for (const failure of selectionFailures) console.error(failure);
  }

  const checkFailures = isStructure
    ? await runStructureCheck(items)
    : await runLinkCheck(items.map(({ entry }) => entry));

  const failureCount = loadFailures.length + selectionFailures.length + checkFailures.length;
  if (failureCount > 0) {
    console.error(`${failureCount} check(s) failed.`);
    process.exit(1);
  }
  console.log(isStructure ? "All structure checks passed." : "All URLs returned 200.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
