/**
 * Search and share text for every static page, in one place so metadata, JSON-LD, the sitemap and
 * the llms files cannot drift apart. Extension pages are built from catalog data instead
 * (see `metadata.ts`).
 *
 * Titles stay under 41 characters so `<title> | Claude Code Mods` fits in 60. Descriptions are
 * 110 to 160 characters and contain no long dashes (a test enforces both).
 */

export interface PageSeo {
  /** Site-relative path with a trailing slash. */
  readonly path: string;
  readonly title: string;
  readonly description: string;
  /** Short name for breadcrumbs. */
  readonly breadcrumbLabel: string;
  /** True when the title already carries the site name, so the title template must be skipped. */
  readonly hasAbsoluteTitle?: boolean;
  /** Set when the page has its own `opengraph-image` and `twitter-image` files: their route folder and alt text. */
  readonly previewImage?: { readonly folder: string; readonly alt: string };
}

export const PAGE_SEO = {
  home: {
    path: "/",
    title: "Claude Code Mods: community directory of extensions",
    description:
      "An unofficial community directory of Claude Code mods, plugins, skills and MCP servers. Each entry links to public source whose URL responded when last checked.",
    breadcrumbLabel: "Home",
    hasAbsoluteTitle: true,
  },
  browse: {
    path: "/browse/",
    title: "Browse Claude Code extensions",
    description:
      "Search and filter Claude Code mods, plugins, skills, agents, hooks, commands and MCP servers by kind, category and how you get them.",
    breadcrumbLabel: "Browse",
  },
  hooks: {
    path: "/hooks/",
    title: "Hook events across Claude Code mods",
    description:
      "Every hook event listed by an entry in the directory and which mods, plugins and hooks use it, split into function hooks for mods and classic hooks.",
    breadcrumbLabel: "Hooks",
  },
  ideas: {
    path: "/ideas/",
    title: "Proposed Claude Code mod ideas",
    description:
      "Mods proposed in the marketplace spec that have no public implementation. They cannot be installed and are kept out of the directory.",
    breadcrumbLabel: "Ideas",
    previewImage: {
      folder: "/ideas",
      alt: "Proposed Claude Code mods from the marketplace spec: none has a public implementation and none can be installed.",
    },
  },
  security: {
    path: "/security/",
    title: "Security: what is and is not checked",
    description:
      "What is checked today, the proposed security tier model that has no scanner yet, and what to check yourself before you install anything.",
    breadcrumbLabel: "Security",
  },
  publish: {
    path: "/publish/",
    title: "Publish a Claude Code extension",
    description:
      "List a Claude Code extension or mod by pull request: the steps, the rules a submission must follow, the entry format and what a listing means.",
    breadcrumbLabel: "Publish",
  },
  about: {
    path: "/about/",
    title: "About this unofficial directory",
    description:
      "What this unofficial directory is, what a mod is, where the data comes from, what Source verified means and how to re-check the links.",
    breadcrumbLabel: "About",
  },
} as const satisfies Record<string, PageSeo>;

export type StaticPageKey = keyof typeof PAGE_SEO;

/** Pages in the order sitemaps and llms files list them. */
export const STATIC_PAGE_KEYS: readonly StaticPageKey[] = ["home", "browse", "hooks", "ideas", "security", "publish", "about"];
