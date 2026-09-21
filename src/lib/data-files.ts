import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * File helpers for the data layer. They use `node:fs`, so everything that imports this module,
 * `catalog.ts` and `ideas.ts` included, must only be imported from server code (a test enforces it).
 * Client components receive data through props.
 */

interface IssueLike {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}

/** Resolved at call time so tests that change the working directory keep working. */
export function defaultDataDirectory(): string {
  return path.join(process.cwd(), "src", "data");
}

/**
 * Shows a project-relative path when the file is inside the working directory,
 * otherwise the absolute path, so error messages point at a file a maintainer can open.
 */
export function displayPath(filePath: string): string {
  const relativePath = path.relative(process.cwd(), filePath);
  const isOutsideWorkingDirectory = relativePath.startsWith("..") || path.isAbsolute(relativePath);
  return isOutsideWorkingDirectory ? filePath : relativePath;
}

/** Formats zod issues as indented `path: message` lines so a bad edit points at the exact field. */
export function formatIssues(issues: readonly IssueLike[]): string {
  return issues
    .map((issue) => {
      const issuePath = issue.path.length > 0 ? issue.path.map(String).join(".") : "(root)";
      return `    ${issuePath}: ${issue.message}`;
    })
    .join("\n");
}

/**
 * Reads and parses a JSON file.
 * @throws Error naming the file when it cannot be read or is not valid JSON.
 */
export function readJsonFile(filePath: string): unknown {
  let text: string;
  try {
    text = readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`${displayPath(filePath)}: cannot read file (${describeError(error)})`, { cause: error });
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`${displayPath(filePath)}: not valid JSON (${describeError(error)})`, { cause: error });
  }
}

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
