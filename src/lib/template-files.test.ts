// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readTemplateFile } from "@/lib/template-files";

const TEMPLATE = "templates/one";

describe("readTemplateFile", () => {
  let root: string;

  function write(relativePath: string, content: string): void {
    const filePath = path.join(root, relativePath);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
  }

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "template-files-"));
    write(`${TEMPLATE}/hooks/a.ts`, "export const a = 1\n\n");
    write("templates/two/hooks/b.ts", "OTHER TEMPLATE");
    write("package.json", "PROJECT SECRET");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("reads a plain file and drops exactly one final newline", () => {
    expect(readTemplateFile(root, TEMPLATE, "hooks/a.ts")).toBe("export const a = 1\n");
  });

  it.each([
    ["a sibling template", "../two/hooks/b.ts"],
    ["the project root", "../../package.json"],
    ["a path that climbs out and back in", "hooks/../../two/hooks/b.ts"],
    ["an absolute path", "/etc/hosts"],
    ["the folder itself", ""],
    ["the folder as a dot", "."],
  ])("refuses %s, and never returns what is there", (_label, relativePath) => {
    let returned: string | undefined;
    expect(() => {
      returned = readTemplateFile(root, TEMPLATE, relativePath);
    }).toThrow(/templates\/one\/.*: (cannot read file|not a regular file)/);
    expect(returned).toBeUndefined();
  });

  it("allows a path that goes down and back up inside its own folder", () => {
    expect(readTemplateFile(root, TEMPLATE, "hooks/../hooks/a.ts")).toBe("export const a = 1\n");
  });

  it("does not mistake a file whose name starts with two dots for an escape", () => {
    write(`${TEMPLATE}/..hidden.ts`, "dotted");
    expect(readTemplateFile(root, TEMPLATE, "..hidden.ts")).toBe("dotted");
  });

  it("refuses a link to a file outside the folder, and a folder that is a link", () => {
    const outside = mkdtempSync(path.join(tmpdir(), "template-files-outside-"));
    try {
      writeFileSync(path.join(outside, "secret.txt"), "TOP SECRET");
      symlinkSync(path.join(outside, "secret.txt"), path.join(root, TEMPLATE, "hooks/link.ts"));
      expect(() => readTemplateFile(root, TEMPLATE, "hooks/link.ts")).toThrow(/not a regular file inside the template folder/);
      mkdirSync(path.join(outside, "dir"));
      writeFileSync(path.join(outside, "dir/x.ts"), "OUTSIDE");
      symlinkSync(path.join(outside, "dir"), path.join(root, TEMPLATE, "linked"));
      expect(() => readTemplateFile(root, TEMPLATE, "linked/x.ts")).toThrow(/not a regular file inside the template folder/);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("names the file when it is missing, or when the root does not exist", () => {
    expect(() => readTemplateFile(root, TEMPLATE, "hooks/missing.ts")).toThrow(/templates\/one\/hooks\/missing\.ts: cannot read file/);
    expect(() => readTemplateFile(path.join(root, "nowhere"), TEMPLATE, "hooks/a.ts")).toThrow(/cannot read file/);
  });
});
