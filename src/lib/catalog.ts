import { lstatSync, readdirSync, type Dirent } from "node:fs";
import path from "node:path";
import {
  communityRuleProblems,
  futureCheckedAtProblem,
  invisibleCharacterProblems,
  todayIso,
} from "@/lib/community-rules";
import {
  defaultDataDirectory,
  describeError,
  displayPath,
  formatIssues,
  readJsonFile,
} from "@/lib/data-files";
import {
  EXTENSION_KINDS,
  catalogSchema,
  extensionSchema,
  type Catalog,
  type Category,
  type Extension,
  type ExtensionKind,
} from "@/lib/types";

/**
 * The directory of extensions: `catalog.json` (curated by maintainers) plus one JSON file per
 * community submission in `community/`. Server code only: this module reads the file system,
 * so client components must receive its data through props (a test enforces it).
 */

export { communityRuleProblems };

const DEFAULT_RELATED_LIMIT = 3;
export const CATALOG_FILE_NAME = "catalog.json";
export const COMMUNITY_DIRECTORY_NAME = "community";
// Files that may sit in the community folder without being a submission. .DS_Store is created by Finder
// and is gitignored, so a local build must not fail because a maintainer opened the folder.
const IGNORED_FILE_NAMES: readonly string[] = [".gitkeep", ".DS_Store"];
const JSON_EXTENSION = ".json";

interface InspectedFile {
  readonly problems: readonly string[];
  /** Present only when the file has no problems. */
  readonly extension?: Extension;
}

/**
 * Lists the community folder. Only regular `<slug>.json` files, `.gitkeep` and Finder's `.DS_Store` are allowed: symlinks,
 * subfolders, other extensions and upper-case `.JSON` are problems, because whatever sits in this
 * folder ends up in a build that other people's pull requests can change.
 */
function listCommunityFiles(communityDirectory: string): {
  readonly files: readonly string[];
  readonly problems: readonly string[];
} {
  const shownDirectory = displayPath(communityDirectory);
  let directoryEntries: readonly Dirent[];
  try {
    const status = lstatSync(communityDirectory);
    if (status.isSymbolicLink() || !status.isDirectory()) {
      return { files: [], problems: [`${shownDirectory}: must be a regular folder, not a symlink or a file`] };
    }
    directoryEntries = readdirSync(communityDirectory, { withFileTypes: true });
  } catch (error) {
    const isMissing = (error as NodeJS.ErrnoException).code === "ENOENT";
    return {
      files: [],
      problems: isMissing ? [] : [`${shownDirectory}: cannot read folder (${describeError(error)})`],
    };
  }

  const files: string[] = [];
  const problems: string[] = [];
  for (const entry of [...directoryEntries].sort((left, right) => left.name.localeCompare(right.name))) {
    const isPlainFile = entry.isFile();
    if (isPlainFile && IGNORED_FILE_NAMES.includes(entry.name)) continue;
    if (isPlainFile && entry.name.endsWith(JSON_EXTENSION)) {
      files.push(path.join(communityDirectory, entry.name));
      continue;
    }
    problems.push(
      `${displayPath(path.join(communityDirectory, entry.name))}: not allowed in the community folder ` +
        `(only regular <slug>${JSON_EXTENSION} files and ${IGNORED_FILE_NAMES.join(" or ")}; no symlinks, subfolders or other names)`,
    );
  }
  return { files, problems };
}

/** Reads one file and returns its parsed value, or the message describing why it is invalid. */
function tryReadJson(filePath: string): { readonly value: unknown } | { readonly problem: string } {
  try {
    return { value: readJsonFile(filePath) };
  } catch (error) {
    return { problem: describeError(error) };
  }
}

function inspectCommunityFile(
  filePath: string,
  existingSlugs: readonly string[],
  fileBySlug: ReadonlyMap<string, string>,
  today: string,
): InspectedFile {
  const read = tryReadJson(filePath);
  if ("problem" in read) {
    return { problems: [read.problem] };
  }
  const result = extensionSchema.safeParse(read.value);
  if (!result.success) {
    const schemaLines = formatIssues(result.error.issues).split("\n").map((line) => line.trim());
    return { problems: [...schemaLines, ...invisibleCharacterProblems(read.value)] };
  }
  const extension = result.data;
  const problems: string[] = [...communityRuleProblems(extension, path.basename(filePath), { existingSlugs })];
  const dateProblem = futureCheckedAtProblem(extension, today);
  if (dateProblem !== null) problems.push(dateProblem);
  const firstFile = fileBySlug.get(extension.slug);
  if (firstFile !== undefined) {
    problems.push(`duplicate slug "${extension.slug}", already defined in ${firstFile}`);
  }
  return problems.length > 0 ? { problems } : { problems, extension };
}

/**
 * Loads `catalog.json` and every `community/*.json` file from `dataDirectory`, validates them and
 * merges them. Every problem in every file is collected, even when `catalog.json` itself is invalid,
 * so one run shows a submitter everything. `today` (YYYY-MM-DD) is injectable for tests.
 * @throws Error naming each offending file path with its field paths, or the two files that
 * define the same slug.
 */
export function loadCatalog(dataDirectory: string, today: string = todayIso()): Catalog {
  const problemBlocks: string[] = [];
  const addBlock = (shownPath: string | null, lines: readonly string[]): void => {
    const text = shownPath === null ? lines.join("\n  ") : `${shownPath}:\n${lines.map((line) => `    ${line}`).join("\n")}`;
    problemBlocks.push(text);
  };

  const catalogPath = path.join(dataDirectory, CATALOG_FILE_NAME);
  const shownCatalogPath = displayPath(catalogPath);
  const fileBySlug = new Map<string, string>();
  let catalog: Catalog | undefined;

  const catalogRead = tryReadJson(catalogPath);
  if ("problem" in catalogRead) {
    addBlock(null, [catalogRead.problem]);
  } else {
    const catalogResult = catalogSchema.safeParse(catalogRead.value);
    if (!catalogResult.success) {
      addBlock(shownCatalogPath, formatIssues(catalogResult.error.issues).split("\n").map((line) => line.trim()));
    } else {
      catalog = catalogResult.data;
      const dateProblems = catalog.extensions.flatMap((extension, index) => {
        const problem = futureCheckedAtProblem(extension, today);
        return problem === null ? [] : [`extensions.${index}.${problem}`];
      });
      if (dateProblems.length > 0) addBlock(shownCatalogPath, dateProblems);
      for (const extension of catalog.extensions) fileBySlug.set(extension.slug, shownCatalogPath);
    }
  }

  const communityExtensions: Extension[] = [];
  const listing = listCommunityFiles(path.join(dataDirectory, COMMUNITY_DIRECTORY_NAME));
  for (const problem of listing.problems) addBlock(null, [problem]);
  for (const filePath of listing.files) {
    const inspected = inspectCommunityFile(filePath, [...fileBySlug.keys()], fileBySlug, today);
    if (inspected.extension === undefined) {
      addBlock(displayPath(filePath), inspected.problems);
      continue;
    }
    fileBySlug.set(inspected.extension.slug, displayPath(filePath));
    communityExtensions.push(inspected.extension);
  }

  if (problemBlocks.length > 0 || catalog === undefined) {
    throw new Error(`Invalid catalog data:\n${problemBlocks.map((block) => `  ${block}`).join("\n")}`);
  }
  return { ...catalog, extensions: [...catalog.extensions, ...communityExtensions] };
}

/** Featured entries first, then name ascending. Stable so pages render deterministically. */
function compareExtensions(left: Extension, right: Extension): number {
  if (left.isFeatured !== right.isFeatured) {
    return left.isFeatured ? -1 : 1;
  }
  return left.name.localeCompare(right.name);
}

let cachedCatalog: Catalog | undefined;
let cachedSortedExtensions: readonly Extension[] | undefined;

/**
 * The merged, validated catalog, loaded once from `src/data` and cached.
 * @throws Error naming the offending file when any data file is invalid.
 */
export function getCatalog(): Catalog {
  cachedCatalog ??= loadCatalog(defaultDataDirectory());
  return cachedCatalog;
}

export function getAllExtensions(): readonly Extension[] {
  cachedSortedExtensions ??= [...getCatalog().extensions].sort(compareExtensions);
  return cachedSortedExtensions;
}

export function getExtensionBySlug(slug: string): Extension | undefined {
  return getAllExtensions().find((extension) => extension.slug === slug);
}

export function getFeaturedExtensions(): readonly Extension[] {
  return getAllExtensions().filter((extension) => extension.isFeatured);
}

/**
 * Entries sharing at least one category with `slug`, excluding itself.
 * Entries with more shared categories come first; ties keep the catalog order.
 */
export function getRelatedExtensions(
  slug: string,
  limit: number = DEFAULT_RELATED_LIMIT,
): readonly Extension[] {
  const source = getExtensionBySlug(slug);
  if (source === undefined || limit <= 0) {
    return [];
  }
  const sourceCategories = new Set<Category>(source.categories);
  return getAllExtensions()
    .filter((candidate) => candidate.slug !== slug)
    .map((candidate) => ({
      candidate,
      sharedCount: candidate.categories.filter((category) => sourceCategories.has(category)).length,
    }))
    .filter(({ sharedCount }) => sharedCount > 0)
    .sort((left, right) => right.sharedCount - left.sharedCount)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function countByKind(): Readonly<Record<ExtensionKind, number>> {
  const counts = Object.fromEntries(EXTENSION_KINDS.map((kind) => [kind, 0])) as Record<ExtensionKind, number>;
  for (const extension of getAllExtensions()) {
    counts[extension.kind] += 1;
  }
  return counts;
}

export function getCatalogGeneratedAt(): string {
  return getCatalog().generatedAt;
}
