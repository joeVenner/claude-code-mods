import { COMMUNITY_REPOSITORY_URL, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import type { Extension } from "@/lib/types";
import { PAGE_SEO, type PageSeo } from "@/lib/seo/pages";
import { absoluteUrl as rawAbsoluteUrl, buildExtensionDescription, extensionPath } from "@/lib/seo/metadata";
import { toSingleLine } from "@/lib/seo/text";
import { toSafeOutputUrl } from "@/lib/url";
import { VIDEO_GROUP_DURATIONS, type Video } from "@/components/docs/tutorialsContent";

/**
 * Schema.org structured data, built as plain objects and serialised by `serializeJsonLd`.
 * Only facts present in the catalog are stated: no ratings, review counts, prices or invented dates.
 */

export type JsonLdValue = string | number | boolean | null | readonly JsonLdValue[] | { readonly [key: string]: JsonLdValue };
export type JsonLdNode = { readonly [key: string]: JsonLdValue };

export interface JsonLdGraph {
  readonly "@context": "https://schema.org";
  readonly "@graph": readonly JsonLdNode[];
}

// JSON allows these characters raw inside strings, but HTML and older JavaScript parsers do not:
// `<` and `>` could close the surrounding script element, `&` starts an entity, and U+2028 and
// U+2029 are line terminators in JavaScript source. The escapes below are valid JSON, so the
// output parses back to the same value.
const UNSAFE_CHARACTERS: Readonly<Record<string, string>> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};
const UNSAFE_PATTERN = /[<>&\u2028\u2029]/g;

/**
 * Serialises data for the inside of a `<script type="application/ld+json">` element. Catalog text
 * can come from community pull requests, so a string such as `</script><script>alert(1)</script>`
 * must never be able to end the element or start another one.
 * @throws TypeError when the value has no JSON representation (for example `undefined`).
 */
export function serializeJsonLd(data: unknown): string {
  const json: string | undefined = JSON.stringify(data);
  if (json === undefined) throw new TypeError("JSON-LD data must be JSON serialisable");
  return json.replace(UNSAFE_PATTERN, (character) => UNSAFE_CHARACTERS[character]);
}

/** Every URL in the graph goes through `toSafeOutputUrl`, so no stored value can carry markup or a scheme other than http(s). */
function absoluteUrl(path: string): string {
  return toSafeOutputUrl(rawAbsoluteUrl(path));
}

const CONTEXT = "https://schema.org" as const;
const WEBSITE_ID = `${absoluteUrl("/")}#website`;
const ORGANIZATION_ID = `${absoluteUrl("/")}#organization`;
/** The same brand icon the web app manifest lists; it is our own mark, never a third party's. */
const LOGO_PATH = "/icons/icon-512.png";

/** SPDX ids the site recognises. A stored license outside this list is not turned into a link. */
const KNOWN_SPDX_IDS: ReadonlySet<string> = new Set([
  "0BSD",
  "AGPL-3.0-only",
  "AGPL-3.0-or-later",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "BSL-1.0",
  "CC-BY-4.0",
  "CC0-1.0",
  "EPL-2.0",
  "GPL-2.0-only",
  "GPL-2.0-or-later",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
  "ISC",
  "LGPL-2.1-only",
  "LGPL-3.0-only",
  "MIT",
  "MPL-2.0",
  "Unlicense",
  "Zlib",
]);

/** `https://spdx.org/licenses/<id>.html` when `license` is exactly a known SPDX id, otherwise null. */
export function spdxLicenseUrl(license: string | null): string | null {
  if (license === null) return null;
  const id = license.trim();
  return KNOWN_SPDX_IDS.has(id) ? `https://spdx.org/licenses/${id}.html` : null;
}

function graph(...nodes: readonly JsonLdNode[]): JsonLdGraph {
  return { "@context": CONTEXT, "@graph": nodes };
}

/** Home, then each step, as absolute URLs. The last step is the current page. */
export function buildBreadcrumbList(steps: readonly { readonly name: string; readonly path: string }[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: steps.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  };
}

const HOME_STEP = { name: PAGE_SEO.home.breadcrumbLabel, path: PAGE_SEO.home.path } as const;

/** Home page: the site as a searchable WebSite plus the publisher of the directory. */
export function buildHomeGraph(): JsonLdGraph {
  return graph(
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      url: absoluteUrl("/"),
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": ORGANIZATION_ID },
      potentialAction: {
        "@type": "SearchAction",
        // The browse page reads `q` from the URL, so this template is a real deep link.
        target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/browse/")}?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: absoluteUrl("/"),
      logo: absoluteUrl(LOGO_PATH),
      sameAs: [toSafeOutputUrl(COMMUNITY_REPOSITORY_URL)],
    },
  );
}

/** Cap on the list, so the browse page's HTML does not grow without bound with the catalog. */
export const BROWSE_LIST_MAX_ITEMS = 200;

/** Browse page: a collection page whose main entity lists the first entries by name and URL. */
export function buildBrowseGraph(allExtensions: readonly Extension[]): JsonLdGraph {
  const extensions = allExtensions.slice(0, BROWSE_LIST_MAX_ITEMS);
  const page = PAGE_SEO.browse;
  const listId = `${absoluteUrl(page.path)}#list`;
  return graph(
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl(page.path)}#page`,
      name: page.title,
      description: page.description,
      url: absoluteUrl(page.path),
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": listId },
    },
    {
      "@type": "ItemList",
      "@id": listId,
      numberOfItems: extensions.length,
      itemListElement: extensions.map((extension, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: toSingleLine(extension.name),
        url: absoluteUrl(extensionPath(extension.slug)),
      })),
    },
    buildBreadcrumbList([HOME_STEP, { name: page.breadcrumbLabel, path: page.path }]),
  );
}

/** Any documentation page: a WebPage and its breadcrumb, with the parent page as a step for a nested page. */
export function buildDocPageGraph(page: PageSeo): JsonLdGraph {
  return graph(
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl(page.path)}#page`,
      name: page.title,
      description: page.description,
      url: absoluteUrl(page.path),
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en",
    },
    buildBreadcrumbList([
      HOME_STEP,
      ...(page.breadcrumbParent === undefined ? [] : [{ name: page.breadcrumbParent.label, path: page.breadcrumbParent.path }]),
      { name: page.breadcrumbLabel, path: page.path },
    ]),
  );
}

/**
 * Extension page: breadcrumb plus the entry as SoftwareSourceCode. The author is the entry's own
 * publisher. GitHub does not tell us whether an owner is a person or a company, so the node is a
 * plain Organization, which schema.org accepts for either. `license` appears only for known SPDX ids.
 * There is no `dateModified`: `checkedAt` is the date the source URL responded, not a change date.
 */
export function buildExtensionGraph(extension: Extension): JsonLdGraph {
  const path = extensionPath(extension.slug);
  const publisher: JsonLdNode = {
    "@type": "Organization",
    name: toSingleLine(extension.publisher.name),
    ...(extension.publisher.url === null ? {} : { url: toSafeOutputUrl(extension.publisher.url) }),
  };
  const licenseUrl = spdxLicenseUrl(extension.license);
  return graph(
    buildBreadcrumbList([
      HOME_STEP,
      { name: PAGE_SEO.browse.breadcrumbLabel, path: PAGE_SEO.browse.path },
      { name: toSingleLine(extension.name), path },
    ]),
    {
      "@type": "SoftwareSourceCode",
      "@id": `${absoluteUrl(path)}#source`,
      name: toSingleLine(extension.name),
      description: buildExtensionDescription(extension),
      url: absoluteUrl(path),
      codeRepository: toSafeOutputUrl(extension.repositoryUrl),
      author: publisher,
      publisher,
      ...(extension.tags.length > 0 ? { keywords: extension.tags.map(toSingleLine).join(", ") } : {}),
      ...(licenseUrl === null ? {} : { license: licenseUrl }),
    },
  );
}

/** The date the announcement issue (and the videos embedded in its body) was published. */
const VIDEOS_UPLOAD_DATE = "2026-09-03";

/**
 * One video as a schema.org VideoObject. `contentUrl` is the exact URL the page's `<video>` element
 * uses, which is also what a crawler would need to fetch the clip. `duration` is set only for the
 * groups the issue states an exact length for (Basic and Advanced, 60 seconds); Case Studies are
 * stated only as "around 2 minutes", so no exact duration is claimed for them.
 */
function buildVideoObjectNode(video: Video): JsonLdNode {
  const durationLabel = VIDEO_GROUP_DURATIONS[video.group];
  return {
    "@type": "VideoObject",
    "@id": `${absoluteUrl(PAGE_SEO.learnTutorials.path)}#${video.id}`,
    name: toSingleLine(video.title),
    description: toSingleLine(video.caption),
    thumbnailUrl: toSafeOutputUrl(video.posterUrl),
    contentUrl: toSafeOutputUrl(video.videoUrl),
    embedUrl: toSafeOutputUrl(video.videoUrl),
    uploadDate: VIDEOS_UPLOAD_DATE,
    ...(durationLabel === "60 seconds" ? { duration: "PT1M" } : {}),
  };
}

/** Tutorials page: a WebPage, its breadcrumb, and one VideoObject per official video. */
export function buildTutorialsGraph(videos: readonly Video[]): JsonLdGraph {
  const page = PAGE_SEO.learnTutorials;
  return graph(
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl(page.path)}#page`,
      name: page.title,
      description: page.description,
      url: absoluteUrl(page.path),
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en",
      ...(videos.length > 0 ? { video: videos.map((video) => ({ "@id": `${absoluteUrl(page.path)}#${video.id}` })) } : {}),
    },
    buildBreadcrumbList([
      HOME_STEP,
      ...(page.breadcrumbParent === undefined ? [] : [{ name: page.breadcrumbParent.label, path: page.breadcrumbParent.path }]),
      { name: page.breadcrumbLabel, path: page.path },
    ]),
    ...videos.map(buildVideoObjectNode),
  );
}
