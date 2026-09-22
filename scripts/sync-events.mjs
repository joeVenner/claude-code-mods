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
import { fetchText } from "./lib/fetch-capped.mjs";
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
