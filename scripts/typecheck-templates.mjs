#!/usr/bin/env node
// Typechecks templates/ against Anthropic's function-hooks declarations, checks that scripts/fixtures/*.positive.ts
// still COMPILE, and that the lines in scripts/fixtures/*.negative.ts still FAIL to typecheck.
//
//   node scripts/typecheck-templates.mjs
//
// The declarations are fetched at the commit pinned in src/data/events.json into a temporary folder
// and deleted afterwards. They are published under "All rights reserved" terms, so they are never
// written into this repository. Needs the network. It runs typescript with an argument list, never a shell.

import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "./lib/fetch-capped.mjs";
import { findSymbolicLinks } from "./lib/find-symlinks.mjs";
import { DECLARATIONS_PATH, UPSTREAM_REPOSITORY } from "./lib/dts-events.mjs";
import { RAW_HOST } from "./lib/github-raw.mjs";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));
const EVENTS_PATH = path.join(PROJECT_ROOT, "src", "data", "events.json");
const COMMIT_SHA = /^[0-9a-f]{40}$/;
// What tsc may use. A declarations file of pathological types could otherwise run for a very long time.
const TSC_TIMEOUT_MS = 180_000;
const TSC_MAX_OLD_SPACE_MB = 2048;
// Folders whose TypeScript is compiled. A symlink in either is refused: tsc follows it into any file.
const CHECKED_DIRECTORIES = ["templates", "scripts/fixtures"];

function describeError(error) {
  return error instanceof Error ? error.message : String(error);
}

/** The commit the site's event list was read at, so the templates are checked against the same declarations. */
async function pinnedSha() {
  const sha = JSON.parse(await readFile(EVENTS_PATH, "utf8")).source?.sha;
  if (typeof sha !== "string" || !COMMIT_SHA.test(sha)) throw new Error("src/data/events.json has no pinned commit");
  return sha;
}

/** Refuses a symlink anywhere under the folders that are compiled, before tsc can follow it. */
async function assertNoSymbolicLinks() {
  for (const directory of CHECKED_DIRECTORIES) {
    const links = await findSymbolicLinks(path.join(PROJECT_ROOT, directory));
    if (links.length > 0) throw new Error(`${directory} holds a symbolic link (${links.join(", ")}); tsc would follow it, so remove it`);
  }
}

async function main() {
  await assertNoSymbolicLinks();
  const sha = await pinnedSha();
  const declarations = await fetchText(`https://${RAW_HOST}/${UPSTREAM_REPOSITORY}/${sha}/${DECLARATIONS_PATH}`);
  const workDirectory = await mkdtemp(path.join(tmpdir(), "typecheck-templates-"));
  try {
    const tsconfig = {
      compilerOptions: {
        target: "ES2022",
        module: "esnext",
        moduleResolution: "bundler",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        types: [],
        lib: ["ES2022"],
      },
      include: [
        path.join(workDirectory, "claude-code.d.ts"),
        path.join(PROJECT_ROOT, "templates", "**", "*.ts"),
        path.join(PROJECT_ROOT, "scripts", "fixtures", "*.negative.ts"),
        path.join(PROJECT_ROOT, "scripts", "fixtures", "*.positive.ts"),
      ],
    };
    await writeFile(path.join(workDirectory, "claude-code.d.ts"), declarations, "utf8");
    const tsconfigPath = path.join(workDirectory, "tsconfig.json");
    await writeFile(tsconfigPath, JSON.stringify(tsconfig), "utf8");

    // Ctrl-C reaches this process and tsc together. Without a handler node would die before the finally
    // below could delete the declarations, so note the signal and let the cleanup run.
    let wasInterrupted = false;
    for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => (wasInterrupted = true));

    const tscPath = createRequire(import.meta.url).resolve("typescript/bin/tsc");
    try {
      execFileSync(process.execPath, [`--max-old-space-size=${TSC_MAX_OLD_SPACE_MB}`, tscPath, "--pretty", "false", "-p", tsconfigPath], {
        stdio: "inherit",
        timeout: TSC_TIMEOUT_MS,
        killSignal: "SIGKILL",
      });
    } catch (error) {
      if (error?.code === "ETIMEDOUT") console.error(`typecheck-templates: tsc ran over ${TSC_TIMEOUT_MS / 1000} seconds and was stopped`);
      // A number status means tsc ran and has already printed every problem. Anything else is a failure to run it.
      else if (typeof error?.status !== "number") console.error(`typecheck-templates: could not run tsc: ${describeError(error)}`);
      process.exitCode = wasInterrupted ? 130 : 1;
      return;
    }
    console.log(`Typechecked templates/ and the negative fixtures against the declarations at ${sha.slice(0, 7)}.`);
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`typecheck-templates failed: ${describeError(error)}`);
  process.exitCode = 1;
});
