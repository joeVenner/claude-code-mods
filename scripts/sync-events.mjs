#!/usr/bin/env node
// Regenerates src/data/events.json from Anthropic's function-hooks type declarations.
//
//   node scripts/sync-events.mjs                 fetch the latest declarations, print what would change
//   node scripts/sync-events.mjs --sha <commit>  use this upstream commit (40 hex characters)
//   node scripts/sync-events.mjs --write         also write src/data/events.json
//
// It never writes without --write, so a change to the event list is always a diff someone reviews.
// The declarations are read into memory and dropped: only event names, their family and the line
// each is declared on are kept (see scripts/lib/dts-events.mjs for why).

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { RAW_HOST } from "./lib/github-raw.mjs";
import {
  DECLARATIONS_PATH,
  EVENT_FAMILIES,
  UPSTREAM_REPOSITORY as REPOSITORY,
  buildEventsFile,
  claudeCodeVersionOf,
  diffEvents,
  extractEvents,
  formatEventsFile,
} from "./lib/dts-events.mjs";

const API_HOST = "api.github.com";
const EVENTS_PATH = fileURLToPath(new URL("../src/data/events.json", import.meta.url));
const REQUEST_TIMEOUT_MS = 20_000;
// The declarations are about 0.5 MB today; anything far beyond that is not what we expect to parse.
const MAX_BYTES = 4 * 1024 * 1024;
const USER_AGENT = "claude-code-mods-events-sync";
const COMMIT_SHA = /^[0-9a-f]{40}$/;

function describeError(error) {
  return error instanceof Error ? error.message : String(error);
}

function parseArguments(argv) {
  const options = { sha: null, write: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--write") {
      options.write = true;
    } else if (argument === "--sha") {
      options.sha = argv[index + 1] ?? "";
      index += 1;
    } else {
      throw new Error(`unknown argument ${JSON.stringify(argument)}`);
    }
  }
  if (options.sha !== null && !COMMIT_SHA.test(options.sha)) {
    throw new Error("--sha must be a full 40 character lowercase commit hash");
  }
  return options;
}

/** GET with a timeout, no redirects and a size cap that counts bytes as they arrive. Only https URLs on the two fixed hosts are built here. */
async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "user-agent": USER_AGENT, accept: "application/vnd.github+json, text/plain" },
  });
  if (response.status !== 200) throw new Error(`${url} answered HTTP ${response.status}`);
  return readCappedText(response, url);
}

/**
 * Reads the body chunk by chunk and stops as soon as it passes the cap. Counting after decompression
 * is the point: a small compressed body must not be able to fill memory before a size check runs.
 */
async function readCappedText(response, url) {
  const reader = response.body?.getReader();
  if (reader === undefined) throw new Error(`${url} returned no body`);
  const chunks = [];
  let totalBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BYTES) {
      await reader.cancel();
      throw new Error(`${url} is over the ${MAX_BYTES} byte limit`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** The newest upstream commit that touched the declarations, so the pinned copy is a real commit, never a branch. */
async function latestCommitSha() {
  const url = `https://${API_HOST}/repos/${REPOSITORY}/commits?path=${DECLARATIONS_PATH}&per_page=1`;
  let commits;
  try {
    commits = JSON.parse(await fetchText(url));
  } catch (error) {
    throw new Error(`could not read the commit list from ${API_HOST}: ${describeError(error)}`, { cause: error });
  }
  const sha = Array.isArray(commits) ? commits[0]?.sha : undefined;
  if (typeof sha !== "string" || !COMMIT_SHA.test(sha)) throw new Error("GitHub did not return a commit hash for the declarations");
  return sha;
}

/** The file already on disk, or null on a first run. A file that cannot be read or parsed stops the run. */
async function readCurrentFile() {
  let text;
  try {
    text = await readFile(EVENTS_PATH, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
  const file = JSON.parse(text);
  if (!Array.isArray(file.events) || typeof file.source?.sha !== "string") {
    throw new Error("src/data/events.json is not an events file; fix or delete it before syncing");
  }
  return file;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const sha = options.sha ?? (await latestCommitSha());
  const text = await fetchText(`https://${RAW_HOST}/${REPOSITORY}/${sha}/${DECLARATIONS_PATH}`);
  const events = extractEvents(text);
  const file = buildEventsFile({
    events,
    sha,
    claudeCodeVersion: claudeCodeVersionOf(text),
    syncedAt: new Date().toISOString().slice(0, 10),
  });

  const previousFile = await readCurrentFile();
  const changes = diffEvents(previousFile?.events ?? [], events);
  const counts = EVENT_FAMILIES.map((family) => `${events.filter((event) => event.family === family).length} ${family}`);
  const list = (names) => (names.length > 0 ? `${names.length}: ${names.join(", ")}` : "0");
  console.log(`Declarations at ${sha.slice(0, 7)} (Claude Code ${file.source.claudeCodeVersion ?? "version unknown"}): ${events.length} events (${counts.join(", ")}).`);
  console.log(`Added ${list(changes.added)}`);
  console.log(`Removed ${list(changes.removed)}`);
  console.log(`Changed family ${list(changes.refamilied)}`);
  console.log(`Moved to another line ${changes.moved.length}${previousFile?.source.sha === sha ? "" : " (the pinned commit changes)"}`);

  const hasChange = previousFile === null || previousFile.source.sha !== sha || Object.values(changes).some((names) => names.length > 0);
  if (!hasChange) {
    console.log("Already up to date. Nothing written.");
    return;
  }
  if (!options.write) {
    console.log("Nothing written. Run again with --write to update src/data/events.json, then review the diff.");
    return;
  }
  await writeFile(EVENTS_PATH, formatEventsFile(file), "utf8");
  console.log("Wrote src/data/events.json.");
}

main().catch((error) => {
  console.error(`sync-events failed: ${describeError(error)}`);
  process.exitCode = 1;
});
