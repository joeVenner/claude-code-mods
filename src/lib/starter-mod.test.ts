// @vitest-environment node
import { mkdtempSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import { STARTER_MOD_DIRECTORY, STARTER_MOD_FILES, loadStarterModFiles } from "@/lib/starter-mod";

describe("the shipped starter mod", () => {
  it("lists every file in the folder, so a new file cannot be left off the page", () => {
    const onDisk = readdirSync(path.join(process.cwd(), STARTER_MOD_DIRECTORY), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.relative(path.join(process.cwd(), STARTER_MOD_DIRECTORY), path.join(entry.parentPath, entry.name)));
    expect(onDisk.sort()).toEqual([...STARTER_MOD_FILES].sort());
  });

  it("is a plugin whose hooks.json names a module that exists", () => {
    const files = new Map(loadStarterModFiles().map((file) => [file.path, file.content]));
    const manifest = JSON.parse(files.get(".claude-plugin/plugin.json") ?? "") as { name: string; version: string };
    const hooks = JSON.parse(files.get("hooks/hooks.json") ?? "") as { modules: string[] };
    expect(manifest.name).toBe("block-force-push");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(hooks.modules).toEqual(["./register.ts"]);
    expect(files.has("hooks/register.ts")).toBe(true);
  });

  it("contains the register entry and the tool.call hook that the page describes", () => {
    const register = loadStarterModFiles().find((file) => file.path === "hooks/register.ts")?.content ?? "";
    expect(register).toContain("export function register(on: On)");
    expect(register).toContain("on('tool.call'");
    expect(register).toContain("{ deny:");
  });

  it("imports the test kit from claude-code/testing and pins a tier", () => {
    for (const file of loadStarterModFiles().filter((entry) => entry.path.endsWith(".test.ts"))) {
      expect(file.content, file.path).toContain("from 'claude-code/testing'");
      expect(file.content, file.path).toContain("tier('user')");
    }
  });

  it("stays inert: no call on $, no network and no process in the hooks it teaches with", () => {
    for (const file of loadStarterModFiles().filter((entry) => entry.path.startsWith("hooks/") && entry.path.endsWith(".ts"))) {
      expect(file.content, file.path).not.toMatch(/\$\.|\bfetch\(|\bprocess\b|\bimport\(|\beval\(/);
    }
  });

  it("holds no secrets, no dashes and no final newline in what it shows", () => {
    for (const file of loadStarterModFiles()) {
      expect(file.content, file.path).not.toMatch(DASH_PATTERN);
      expect(file.content, file.path).not.toMatch(/sk-|api[_-]?key|password|token/i);
      expect(file.content.endsWith("\n"), file.path).toBe(false);
    }
  });
});

describe("loadStarterModFiles with a root directory", () => {
  let rootDirectory: string;

  beforeEach(() => {
    rootDirectory = mkdtempSync(path.join(tmpdir(), "starter-mod-"));
  });

  afterEach(() => {
    rmSync(rootDirectory, { recursive: true, force: true });
  });

  it("names the missing file", () => {
    mkdirSync(path.join(rootDirectory, STARTER_MOD_DIRECTORY), { recursive: true });
    expect(() => loadStarterModFiles(rootDirectory)).toThrow(/templates\/mod-starter\/\.claude-plugin\/plugin\.json: cannot read file/);
  });

  it("reads files in the order they are listed and drops one final newline only", () => {
    for (const relativePath of STARTER_MOD_FILES) {
      const filePath = path.join(rootDirectory, STARTER_MOD_DIRECTORY, relativePath);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, `${relativePath}\n\n`);
    }
    const files = loadStarterModFiles(rootDirectory);
    expect(files.map((file) => file.path)).toEqual([...STARTER_MOD_FILES]);
    expect(files[0].content).toBe(`${STARTER_MOD_FILES[0]}\n`);
  });
});

describe("loadStarterModFiles refuses anything that is not a plain file in its place", () => {
  let rootDirectory: string;
  let outsideDirectory: string;

  function writeAllFiles(): void {
    for (const relativePath of STARTER_MOD_FILES) {
      const filePath = path.join(rootDirectory, STARTER_MOD_DIRECTORY, relativePath);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, `${relativePath}\n`);
    }
  }

  beforeEach(() => {
    rootDirectory = mkdtempSync(path.join(tmpdir(), "starter-mod-links-"));
    outsideDirectory = mkdtempSync(path.join(tmpdir(), "starter-mod-outside-"));
    writeFileSync(path.join(outsideDirectory, "secret.txt"), "TOP SECRET");
    writeAllFiles();
  });

  afterEach(() => {
    rmSync(rootDirectory, { recursive: true, force: true });
    rmSync(outsideDirectory, { recursive: true, force: true });
  });

  it("accepts the plain files, even when the root directory is itself reached through a link", () => {
    const linkedRoot = path.join(outsideDirectory, "linked-root");
    symlinkSync(rootDirectory, linkedRoot);
    expect(loadStarterModFiles(linkedRoot)).toHaveLength(STARTER_MOD_FILES.length);
  });

  it("refuses a file that is a link to a file outside the folder, and never returns its contents", () => {
    const filePath = path.join(rootDirectory, STARTER_MOD_DIRECTORY, "hooks/register.ts");
    rmSync(filePath);
    symlinkSync(path.join(outsideDirectory, "secret.txt"), filePath);
    expect(() => loadStarterModFiles(rootDirectory)).toThrow(/hooks\/register\.ts: not a regular file inside the template folder/);
  });

  it("refuses a file that is a link to another listed file", () => {
    const filePath = path.join(rootDirectory, STARTER_MOD_DIRECTORY, "hooks/register.ts");
    rmSync(filePath);
    symlinkSync(path.join(rootDirectory, STARTER_MOD_DIRECTORY, "hooks/hooks.json"), filePath);
    expect(() => loadStarterModFiles(rootDirectory)).toThrow(/not a regular file inside the template folder/);
  });

  it("refuses a folder that is a link, so the files inside it are not the listed ones", () => {
    const hooksDirectory = path.join(rootDirectory, STARTER_MOD_DIRECTORY, "hooks");
    rmSync(hooksDirectory, { recursive: true });
    mkdirSync(path.join(outsideDirectory, "hooks"));
    for (const name of ["hooks.json", "register.ts", "is-force-push.ts"]) writeFileSync(path.join(outsideDirectory, "hooks", name), "OUTSIDE");
    symlinkSync(path.join(outsideDirectory, "hooks"), hooksDirectory);
    expect(() => loadStarterModFiles(rootDirectory)).toThrow(/not a regular file inside the template folder/);
  });

  it("refuses a starter folder that is itself a link to somewhere else", () => {
    const starterDirectory = path.join(rootDirectory, STARTER_MOD_DIRECTORY);
    rmSync(starterDirectory, { recursive: true });
    // The target holds every listed file, so only the real-path check can refuse it.
    for (const relativePath of STARTER_MOD_FILES) {
      const filePath = path.join(outsideDirectory, "elsewhere", relativePath);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, "OUTSIDE");
    }
    symlinkSync(path.join(outsideDirectory, "elsewhere"), starterDirectory);
    expect(() => loadStarterModFiles(rootDirectory)).toThrow(/not a regular file inside the template folder/);
  });

  it("refuses a listed path that is a directory", () => {
    const filePath = path.join(rootDirectory, STARTER_MOD_DIRECTORY, "hooks/register.ts");
    rmSync(filePath);
    mkdirSync(filePath);
    expect(() => loadStarterModFiles(rootDirectory)).toThrow(/not a regular file inside the template folder/);
  });
});
