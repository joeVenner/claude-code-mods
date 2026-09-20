#!/usr/bin/env node
// Checks that every URL in src/data/catalog.json is publicly reachable (HTTP 200).
// Sequential with a delay between requests so we do not hammer GitHub or the docs host.
// Usage: npm run catalog:verify

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const CATALOG_PATH = fileURLToPath(new URL("../src/data/catalog.json", import.meta.url));
const REQUEST_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT = "claude-code-mods-catalog-verify (link check)";
const MAX_REDIRECTS = 5;
// Keep in sync with ALLOWED_CATALOG_HOSTS in src/lib/url.ts. The script reads raw JSON, so a hostile
// catalog change must not be able to make a maintainer's machine fetch an arbitrary or internal host.
const ALLOWED_HOSTS = new Set(["github.com", "code.claude.com"]);

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Collects every URL with the entries that reference it, so each URL is fetched once. */
function collectUrls(catalog) {
  const referencesByUrl = new Map();
  const add = (url, slug, field) => {
    if (typeof url !== "string") return;
    const references = referencesByUrl.get(url) ?? [];
    references.push(`${slug}:${field}`);
    referencesByUrl.set(url, references);
  };
  for (const entry of catalog.extensions) {
    add(entry.verification.sourceUrl, entry.slug, "sourceUrl");
    add(entry.repositoryUrl, entry.slug, "repositoryUrl");
    add(entry.publisher.url, entry.slug, "publisher.url");
    for (const link of entry.links) add(link.url, entry.slug, `link(${link.label})`);
  }
  return referencesByUrl;
}

function assertAllowedUrl(value) {
  const url = new URL(value);
  const isAllowed =
    url.protocol === "https:" && !url.username && !url.password && !url.port && ALLOWED_HOSTS.has(url.hostname);
  if (!isAllowed) throw new Error(`refusing to fetch ${value}: not an https URL on an allowed host`);
  return url;
}

/** Follows redirects by hand so every hop is checked against the allowlist, not just the first URL. */
async function requestWithSafeRedirects(url, method) {
  let current = assertAllowedUrl(url);
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
    current = assertAllowedUrl(new URL(location, current).href);
  }
  throw new Error(`more than ${MAX_REDIRECTS} redirects for ${url}`);
}

async function fetchStatus(url) {
  const headResponse = await requestWithSafeRedirects(url, "HEAD");
  if (headResponse.status !== 405 && headResponse.status !== 501) {
    return headResponse.status;
  }
  // Some hosts reject HEAD; fall back to GET and discard the body.
  const getResponse = await requestWithSafeRedirects(url, "GET");
  await getResponse.body?.cancel();
  return getResponse.status;
}

async function main() {
  const catalog = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  const referencesByUrl = collectUrls(catalog);
  const failures = [];
  let checkedCount = 0;

  for (const [url, references] of referencesByUrl) {
    let outcome;
    try {
      outcome = String(await fetchStatus(url));
    } catch (error) {
      outcome = `error (${error instanceof Error ? error.message : String(error)})`;
    }
    checkedCount += 1;
    if (outcome === "200") {
      console.log(`200 ${url}`);
    } else {
      console.error(`${outcome} ${url}\n    used by: ${references.join(", ")}`);
      failures.push({ url, outcome, references });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`\nChecked ${checkedCount} unique URLs for ${catalog.extensions.length} entries.`);
  if (failures.length > 0) {
    console.error(`${failures.length} URL(s) did not return 200.`);
    process.exit(1);
  }
  console.log("All URLs returned 200.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
