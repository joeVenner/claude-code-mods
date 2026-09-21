// @vitest-environment node
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * catalog.ts, ideas.ts and data-files.ts read the file system with node:fs. Bundling them into a
 * client component would break the build, or ship the whole catalog to every visitor, so client
 * components must get data through props from a server component. The check follows imports
 * transitively, so a barrel file or a helper cannot hide the import.
 */
const PROJECT_ROOT = process.cwd();
const SOURCE_ROOT = path.join(PROJECT_ROOT, "src");
const SERVER_ONLY_FILES = ["src/lib/catalog.ts", "src/lib/ideas.ts", "src/lib/events.ts", "src/lib/starter-mod.ts", "src/lib/data-files.ts"] as const;
const SOURCE_EXTENSIONS = [".ts", ".tsx"] as const;
const USE_CLIENT_DIRECTIVE = /^\s*(?:(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*["']use client["']/;
// Type-only imports are erased by the compiler, so they cannot pull a module into the bundle.
const IMPORT_SPECIFIER =
  /(?:^|[\s;{}])(?:import|export)\s+(?!type\b)(?:[^"'`;]*?\sfrom\s*)?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)|\brequire\(\s*["']([^"']+)["']\s*\)/g;

function listSourceFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    return SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension)) ? [fullPath] : [];
  });
}

/** Resolves `@/x` and relative specifiers to a file under `root`, or null for packages and node modules. */
function resolveImport(specifier: string, fromFile: string, root: string): string | null {
  const isAlias = specifier.startsWith("@/");
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  if (!isAlias && !isRelative) return null;
  const base = isAlias
    ? path.join(root, "src", specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

function importsOf(file: string, root: string): readonly string[] {
  const text = readFileSync(file, "utf8");
  const resolved: string[] = [];
  for (const match of text.matchAll(IMPORT_SPECIFIER)) {
    const specifier = match[1] ?? match[2] ?? match[3];
    const target = resolveImport(specifier, file, root);
    if (target !== null) resolved.push(target);
  }
  return resolved;
}

/**
 * For every 'use client' file under `<root>/src`, walks its imports and returns the chain to any
 * server-only file it can reach, as `client -> ... -> server` strings relative to `root`.
 */
export function findServerOnlyChains(root: string, serverOnlyFiles: readonly string[]): readonly string[] {
  const serverOnly = new Set(serverOnlyFiles.map((file) => path.join(root, file)));
  const chains: string[] = [];
  const shown = (file: string): string => path.relative(root, file);
  for (const clientFile of listSourceFiles(path.join(root, "src"))) {
    if (!USE_CLIENT_DIRECTIVE.test(readFileSync(clientFile, "utf8"))) continue;
    const visited = new Set<string>([clientFile]);
    const queue: (readonly string[])[] = [[clientFile]];
    for (let chain = queue.shift(); chain !== undefined; chain = queue.shift()) {
      for (const target of importsOf(chain[chain.length - 1], root)) {
        if (visited.has(target)) continue;
        visited.add(target);
        const next = [...chain, target];
        if (serverOnly.has(target)) chains.push(next.map(shown).join(" -> "));
        else queue.push(next);
      }
    }
  }
  return chains;
}

describe("server-only data modules in the real source tree", () => {
  it("scans real client files", () => {
    const clientFiles = listSourceFiles(SOURCE_ROOT).filter((file) =>
      USE_CLIENT_DIRECTIVE.test(readFileSync(file, "utf8")),
    );
    expect(clientFiles.length).toBeGreaterThan(0);
    for (const file of SERVER_ONLY_FILES) expect(existsSync(path.join(PROJECT_ROOT, file)), file).toBe(true);
  });

  it("are not reachable from any 'use client' file, directly or through other modules", () => {
    expect(findServerOnlyChains(PROJECT_ROOT, SERVER_ONLY_FILES)).toEqual([]);
  });
});

describe("findServerOnlyChains on a synthetic tree", () => {
  let root: string;

  const write = (relativePath: string, content: string): void => {
    const fullPath = path.join(root, relativePath);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  };
  const findChains = (): readonly string[] => findServerOnlyChains(root, ["src/lib/catalog.ts"]);

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "server-only-"));
    write("src/lib/catalog.ts", "export const x = 1;\n");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("finds a direct alias import", () => {
    write("src/components/A.tsx", '"use client";\nimport { x } from "@/lib/catalog";\nexport const A = x;\n');
    expect(findChains()).toEqual(["src/components/A.tsx -> src/lib/catalog.ts"]);
  });

  it("finds an import through a relative barrel and a helper", () => {
    write("src/components/index.ts", 'export * from "./helper";\n');
    write("src/components/helper.ts", 'import { x } from "../lib/catalog";\nexport const helper = x;\n');
    write("src/components/B.tsx", "'use client'\nimport { helper } from \"./index\";\nexport const B = helper;\n");
    write("src/components/C.tsx", '"use client";\nimport { helper } from "@/components";\nexport const C = helper;\n');
    expect(findChains()).toEqual([
      "src/components/B.tsx -> src/components/index.ts -> src/components/helper.ts -> src/lib/catalog.ts",
      "src/components/C.tsx -> src/components/index.ts -> src/components/helper.ts -> src/lib/catalog.ts",
    ]);
  });

  it("finds dynamic imports and re-exports", () => {
    write("src/components/D.tsx", '"use client";\nexport const load = () => import("@/lib/catalog");\n');
    write("src/components/E.tsx", '"use client";\nexport { x } from "@/lib/catalog";\n');
    expect(findChains()).toHaveLength(2);
  });

  it("ignores type-only imports, packages, and server files that no client file reaches", () => {
    write("src/components/F.tsx", '"use client";\nimport type { x } from "@/lib/catalog";\nimport { useState } from "react";\n');
    write("src/app/page.tsx", 'import { x } from "@/lib/catalog";\nexport default x;\n');
    write("src/components/G.tsx", 'import { x } from "@/lib/catalog";\nexport const G = x;\n');
    expect(findChains()).toEqual([]);
  });

  it("does not treat a file as client code unless the directive comes first", () => {
    write("src/components/H.tsx", 'import { x } from "@/lib/catalog";\n"use client";\nexport const H = x;\n');
    expect(findChains()).toEqual([]);
  });

  it("recognises the directive after comments", () => {
    write("src/components/I.tsx", '// note\n/* more */\n"use client";\nimport { x } from "@/lib/catalog";\nexport const I = x;\n');
    expect(findChains()).toHaveLength(1);
  });

  it("terminates on import cycles", () => {
    write("src/components/J.tsx", '"use client";\nimport { k } from "./K";\nexport const j = k;\n');
    write("src/components/K.ts", 'import { j } from "./J";\nexport const k = j;\n');
    expect(findChains()).toEqual([]);
  });
});
