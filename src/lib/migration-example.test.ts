// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import {
  MIGRATION_EXAMPLE_DIRECTORY,
  MIGRATION_EXAMPLE_OTHER_FILES,
  MIGRATION_EXAMPLE_SHOWN_FILES,
  loadMigrationExampleFiles,
} from "@/lib/migration-example";

describe("the shipped migration example", () => {
  it("accounts for every file in the folder, shown or deliberately not shown", () => {
    const root = path.join(process.cwd(), MIGRATION_EXAMPLE_DIRECTORY);
    const onDisk = readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)));
    expect(onDisk.sort()).toEqual([...MIGRATION_EXAMPLE_SHOWN_FILES, ...MIGRATION_EXAMPLE_OTHER_FILES].sort());
  });

  it("is a plugin whose hooks.json names the module the page shows", () => {
    const root = path.join(process.cwd(), MIGRATION_EXAMPLE_DIRECTORY);
    const hooks = JSON.parse(readFileSync(path.join(root, "hooks/hooks.json"), "utf8")) as { modules: string[] };
    expect(hooks.modules).toEqual(["./register.ts"]);
  });

  it("hooks each classic event under its classic.<Name> name, and no other event", () => {
    const [register] = loadMigrationExampleFiles();
    const hooked = [...register.content.matchAll(/on\('([^']+)'/g)].map((match) => match[1]);
    expect(hooked).toEqual(["classic.PreToolUse", "classic.Stop", "classic.UserPromptSubmit"]);
  });

  it("uses the result fields the Migration page explains: deny, block and additionalContext", () => {
    const [register] = loadMigrationExampleFiles();
    for (const field of ["{ deny:", "{ block:", "additionalContext", "stop_hook_active", "next(e)"]) expect(register.content).toContain(field);
  });

  it("stays inert: no call on $, no network and no process", () => {
    const [register] = loadMigrationExampleFiles();
    expect(register.content).not.toMatch(/\$\.|\bfetch\(|\bprocess\b|\bimport\(|\beval\(/);
  });

  it("has no dashes and no final newline in what it shows", () => {
    const [register] = loadMigrationExampleFiles();
    expect(register.content).not.toMatch(DASH_PATTERN);
    expect(register.content.endsWith("\n")).toBe(false);
  });
});
