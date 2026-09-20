import rawCatalog from "@/data/catalog.json";
import {
  CATEGORIES,
  EXTENSION_KINDS,
  catalogSchema,
  type Catalog,
  type Category,
  type Extension,
  type ExtensionKind,
} from "@/lib/types";

const DEFAULT_RELATED_LIMIT = 3;

let cachedCatalog: Catalog | undefined;
let cachedSortedExtensions: readonly Extension[] | undefined;

/**
 * Formats zod issues as `path: message` lines so a bad catalog edit points at the exact entry.
 */
function formatIssues(issues: readonly { path: readonly PropertyKey[]; message: string }[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.map(String).join(".") : "(root)";
      return `  ${path}: ${issue.message}`;
    })
    .join("\n");
}

/** Featured entries first, then name ascending. Stable so pages render deterministically. */
function compareExtensions(left: Extension, right: Extension): number {
  if (left.isFeatured !== right.isFeatured) {
    return left.isFeatured ? -1 : 1;
  }
  return left.name.localeCompare(right.name);
}

/**
 * Validates `catalog.json` once and caches the result.
 * @throws Error listing every zod issue with its path when the catalog is invalid.
 */
export function getCatalog(): Catalog {
  if (cachedCatalog !== undefined) {
    return cachedCatalog;
  }
  const result = catalogSchema.safeParse(rawCatalog);
  if (!result.success) {
    throw new Error(`Invalid catalog.json:\n${formatIssues(result.error.issues)}`);
  }
  cachedCatalog = result.data;
  return cachedCatalog;
}

export function getAllExtensions(): readonly Extension[] {
  if (cachedSortedExtensions === undefined) {
    cachedSortedExtensions = [...getCatalog().extensions].sort(compareExtensions);
  }
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

/** An entry with several categories counts once in each of them. */
export function countByCategory(): Readonly<Record<Category, number>> {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as Record<Category, number>;
  for (const extension of getAllExtensions()) {
    for (const category of extension.categories) {
      counts[category] += 1;
    }
  }
  return counts;
}

export function getCatalogGeneratedAt(): string {
  return getCatalog().generatedAt;
}
