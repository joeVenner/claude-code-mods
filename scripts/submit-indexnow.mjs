#!/usr/bin/env node
// Tells IndexNow (Bing, Yandex, Seznam.cz and Naver) that pages changed, instead of waiting for their
// next crawl. Never run automatically: it needs the network and it is a real submission, so a
// maintainer runs it by hand after a deploy.
//
//   node scripts/submit-indexnow.mjs                 submit every URL in the live sitemap
//   node scripts/submit-indexnow.mjs --url <url>...  submit only these URLs (repeatable)
//   node scripts/submit-indexnow.mjs --dry-run        print what would be submitted, make no request
//   node scripts/submit-indexnow.mjs --site <url>     use this origin instead of the live site
//
// The key comes from src/data/indexnow-key.json, the same file src/lib/seo/indexNow.ts reads, so the
// value submitted here can never drift from the one the key file route serves.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fetchText } from "./lib/fetch-capped.mjs";
import { buildSubmissionPayload, extractSitemapUrls, INDEXNOW_ENDPOINT, parseArguments } from "./lib/indexnow.mjs";

const KEY_PATH = fileURLToPath(new URL("../src/data/indexnow-key.json", import.meta.url));
const REQUEST_TIMEOUT_MS = 20_000;

function describeError(error) {
  return error instanceof Error ? error.message : String(error);
}

async function readKey() {
  const parsed = JSON.parse(await readFile(KEY_PATH, "utf8"));
  return parsed.key;
}

async function submit(payload) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  return { status: response.status, body: await response.text() };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const key = await readKey();
  const urls = options.urls.length > 0 ? options.urls : extractSitemapUrls(await fetchText(`${options.siteUrl}/sitemap.xml`));
  const payload = buildSubmissionPayload({ urls, key, siteUrl: options.siteUrl });

  console.log(`${urls.length} URL(s) for host ${payload.host}, key file at ${payload.keyLocation}`);
  for (const url of urls) console.log(`  ${url}`);

  if (options.dryRun) {
    console.log("--dry-run: no request sent.");
    return;
  }

  const result = await submit(payload);
  console.log(`IndexNow answered HTTP ${result.status}${result.body === "" ? "" : `: ${result.body}`}`);
  if (result.status >= 400) process.exitCode = 1;
}

main().catch((error) => {
  console.error(describeError(error));
  process.exitCode = 1;
});
