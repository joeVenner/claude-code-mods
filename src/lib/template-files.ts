import { lstatSync, readFileSync, realpathSync, type Stats } from "node:fs";
import path from "node:path";
import { describeError } from "@/lib/data-files";

/**
 * Reads one file of a template mod under `templates/` for the Learn pages.
 *
 * The file must sit inside its template folder, and it must be a regular file whose real path is
 * exactly where it is listed. A `..` segment or an absolute path is refused, and so is a symlink in
 * the file or in any folder above it: the build renders these files as public text, so a pull request
 * that swapped one for a link to another file on the build machine would publish it.
 * Server code only: this module reads the file system.
 * @returns the file text without its final newline
 * @throws Error naming the file when it cannot be read, escapes its folder, or is not a regular file.
 */
export function readTemplateFile(rootDirectory: string, templateDirectory: string, relativePath: string): string {
  const label = `${templateDirectory}/${relativePath}`;
  const filePath = path.join(rootDirectory, templateDirectory, relativePath);
  let realPath: string;
  let stats: Stats;
  let expectedPath: string;
  try {
    const templateRoot = path.join(realpathSync(rootDirectory), templateDirectory);
    expectedPath = path.join(templateRoot, relativePath);
    if (isOutside(templateRoot, expectedPath)) throw new Error("the path leaves the template folder");
    realPath = realpathSync(filePath);
    stats = lstatSync(filePath);
  } catch (error) {
    throw new Error(`${label}: cannot read file (${describeError(error)})`, { cause: error });
  }
  if (realPath !== expectedPath || !stats.isFile()) throw new Error(`${label}: not a regular file inside the template folder`);
  try {
    return readFileSync(filePath, "utf8").replace(/\n$/, "");
  } catch (error) {
    throw new Error(`${label}: cannot read file (${describeError(error)})`, { cause: error });
  }
}

/** True when `target` is the folder itself, or is not strictly inside `folder`. path.join has already resolved any `..`. */
function isOutside(folder: string, target: string): boolean {
  const relative = path.relative(folder, target);
  return relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}
