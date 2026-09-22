// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findSymbolicLinks } from "../../scripts/lib/find-symlinks.mjs";

describe("findSymbolicLinks", () => {
  let root: string;
  let outside: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "find-symlinks-"));
    outside = mkdtempSync(path.join(tmpdir(), "find-symlinks-outside-"));
    writeFileSync(path.join(outside, "secret.ts"), "SECRET");
    mkdirSync(path.join(root, "a/b"), { recursive: true });
    writeFileSync(path.join(root, "a/b/plain.ts"), "export {}");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });

  it("returns nothing for a folder of plain files", async () => {
    expect(await findSymbolicLinks(root)).toEqual([]);
  });

  it("finds a link to a file at any depth, with forward slashes", async () => {
    symlinkSync(path.join(outside, "secret.ts"), path.join(root, "a/b/link.ts"));
    symlinkSync(path.join(outside, "secret.ts"), path.join(root, "top.ts"));
    expect(await findSymbolicLinks(root)).toEqual(["a/b/link.ts", "top.ts"]);
  });

  it("reports a link to a folder without walking into it", async () => {
    writeFileSync(path.join(outside, "inner.ts"), "x");
    symlinkSync(outside, path.join(root, "linked-dir"));
    expect(await findSymbolicLinks(root)).toEqual(["linked-dir"]);
  });

  it("reports a link that points at nothing", async () => {
    symlinkSync(path.join(outside, "gone.ts"), path.join(root, "dangling.ts"));
    expect(await findSymbolicLinks(root)).toEqual(["dangling.ts"]);
  });

  it("fails, naming the folder, when it cannot be read", async () => {
    await expect(findSymbolicLinks(path.join(root, "missing"))).rejects.toThrow(/missing/);
  });
});
