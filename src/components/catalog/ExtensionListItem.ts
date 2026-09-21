import { searchExtensions } from "@/lib/search";
import type { Extension, SearchFilters } from "@/lib/types";

/**
 * The fields the list views (hero search, browse grid, cards, rows) actually read. Client
 * components receive this instead of a full `Extension`, so long-form data such as the guide is
 * not serialized into the page props of `/` and `/browse/`. Detail pages keep the full entry.
 */
export type ExtensionListItem = Pick<
  Extension,
  | "slug"
  | "name"
  | "kind"
  | "categories"
  | "summary"
  | "publisher"
  | "availability"
  | "stars"
  | "verification"
  | "isFeatured"
  | "hooks"
  | "tags"
>;

/** Copies only the list fields, so nothing else can leak into client props through a spread. */
export function toListItem(extension: Extension): ExtensionListItem {
  return {
    slug: extension.slug,
    name: extension.name,
    kind: extension.kind,
    categories: extension.categories,
    summary: extension.summary,
    publisher: extension.publisher,
    availability: extension.availability,
    stars: extension.stars,
    verification: extension.verification,
    isFeatured: extension.isFeatured,
    hooks: extension.hooks,
    tags: extension.tags,
  };
}

export function toListItems(extensions: readonly Extension[]): readonly ExtensionListItem[] {
  return extensions.map(toListItem);
}

/**
 * Same filtering and ranking as `searchExtensions`, for list items. The data layer types that
 * function for a full `Extension` although it only reads fields that `ExtensionListItem` carries
 * (name, slug, tags, hooks, summary, kind, categories, availability), so one narrow cast bridges
 * the two. Delete it once `searchExtensions` is generic over the fields it reads.
 */
export function searchListItems<Item extends ExtensionListItem>(
  items: readonly Item[],
  filters: SearchFilters,
): readonly Item[] {
  return searchExtensions(items as unknown as readonly Extension[], filters) as unknown as readonly Item[];
}
