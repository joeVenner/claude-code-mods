# Claude Code Mods

An unofficial community directory of Claude Code mods and extensions: mods, plugins, skills, agents, hooks, MCP servers and slash commands.

> Not affiliated with or endorsed by Anthropic.

## Mods first

A mod is a Claude Code plugin whose behaviour lives in a hooks module. Anthropic publishes four in [anthropics/claude-code](https://github.com/anthropics/claude-code/tree/main/mods): `sec-default`, `diff`, `telemetry` and `agents-md`. They ship inside Claude Code, they are early access, and the API they are written against may change between releases without notice. Each has its own page here with what it does, how to run it from source and where to download it.

## What is real

Every entry in the directory has public source.

- **Source verified**: the entry's source URL returned HTTP 200 on the catalog date. This means the source exists. It does **not** mean the code was reviewed or security scanned, and nothing here claims it was.
- **Availability**: an entry is installable (it has documented install commands), built in (it ships inside Claude Code) or source only.
- **Ideas**: the marketplace spec describes more mods that nobody has published. They live on the Ideas page and in `src/data/ideas.json`, apart from the directory, its counts and its search. They cannot be installed.

The specification's security tiers (A, B, C, revoked) are a design, not a running scanner. No listing has a tier today.

## List an extension

Community listings are added by pull request. In short:

1. Fork this repository and clone your fork.
2. Add one file, `src/data/community/<slug>.json`, holding one entry.
3. Run `npm test`, then `npm run catalog:verify -- --only <file>` and `npm run catalog:structure -- --only <file>`.
4. Open a pull request. CI runs the same checks.
5. A maintainer reads the entry and merges it, and the site rebuilds.

CI checks the shape of the entry, that its URLs respond and that its manifest files exist. It cannot prove that a command or a package is safe. A maintainer reads the text of each submission, not the code it points to. Listed means the source exists. It does not mean reviewed. Community entries carry a visible "Community listing" label.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the rules (including which commands an entry may contain), the field list and an example entry.

Open item: this repository has no LICENSE file yet, and the maintainer will decide the license that applies to submitted data.

## Stack

Next.js 16 (App Router, static export), React 19, Tailwind CSS v4, strict TypeScript, Zod, Motion, Phosphor icons, Vitest and Testing Library.

## Develop

Requires Node 22 or newer.

```bash
npm ci
npm run dev          # http://localhost:3000
npm run typecheck
npm run lint
npm test
npm run build        # static export to ./out
```

## Catalog

Maintainer entries live in `src/data/catalog.json` and community entries in `src/data/community/<slug>.json`. Both are validated at load time against the Zod schema in `src/lib/types.ts`. Ideas live in `src/data/ideas.json`.

```bash
npm run catalog:verify      # re-checks every URL, exits non-zero on any non-200
npm run catalog:structure   # checks that plugin and mod entries have their manifest files
```

Add `-- --only <file>` to either command to check just one data file. Pages read the catalog only through `src/lib/catalog.ts`, `src/lib/ideas.ts` and `src/lib/search.ts`. Nothing in the UI hardcodes entry names, counts or star numbers.

CI (`.github/workflows/validate.yml`) runs typecheck, lint, tests and a build on every pull request, runs the two catalog checks on the community files a pull request adds or changes, and asks a submission to touch only `src/data/community/`. That last check is advisory, because a pull request runs its own workflow; the real protection is `.github/CODEOWNERS` plus a branch ruleset that requires code owner review. `.github/workflows/reverify.yml` re-runs both catalog checks on every entry each week, so link rot or a rewritten repository shows up as a failed run.

## SEO, GEO and previews

Everything below is generated at build time from the catalog, so nothing lists an entry by hand. Code lives in `src/lib/seo/` (pure and unit tested) and `src/components/seo/`.

| File | What it is |
| --- | --- |
| `src/lib/seo/metadata.ts` | One typed helper that builds `Metadata` for every page: title, description, absolute canonical URL, Open Graph, Twitter card, robots, author and the Atom feed link. |
| `src/lib/seo/pages.ts` | Title and description of each static page. Edit copy there. |
| `src/app/opengraph-image.tsx`, `twitter-image.tsx` | The 1200 by 630 site banner. Pages without their own image use it. |
| `src/app/extensions/[slug]/opengraph-image.tsx`, `src/app/ideas/opengraph-image.tsx` | Per-page link preview images. Catalog text is clamped and rendered only as text. |
| `src/app/icon.tsx`, `apple-icon.tsx`, `favicon.ico`, `manifest.ts`, `icons/` | The brand mark as favicon, touch icon and web app icons (192, 512 and maskable). |
| `src/app/llms.txt/`, `llms-full.txt/` | Index and full text of the directory for AI search, following [llmstxt.org](https://llmstxt.org). |
| `src/app/feed.xml/` | Atom feed, newest source check first. |
| `src/app/catalog.json/` | The whole catalog as one read-only JSON document for tools that would otherwise scrape pages. It is data, not a Claude Code plugin marketplace: it has no install semantics. Community entries are reduced to an allowlisted index record, like in `llms-full.txt`. Built by `src/lib/seo/catalogJson.ts`. |
| `src/app/hooks/`, `src/lib/hooks-index.ts` | The `/hooks/` page: every hook event any entry lists, and which entries use it, split into function hooks (mods) and classic hooks (everything else). Derived from each entry's `hooks` field, so no event name is written by hand. |
| `src/app/robots.ts`, `sitemap.ts` | Crawler rules (search and AI crawlers are allowed by name) and every indexable page with its own last modified date. |
| `src/lib/seo/jsonLd.ts` | JSON-LD graphs and `serializeJsonLd`, the only place catalog text is serialised into a `<script>`. |
| `src/assets/fonts/` | Geist and Geist Mono for the generated images, under the SIL Open Font License (`OFL.txt` beside them). |

Environment variables, all optional:

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production origin used in canonical URLs, Open Graph URLs, the sitemap and the feed. Defaults to `https://claudecodemods.com` in production builds and `http://localhost:3000` otherwise. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Value of the Google Search Console `google-site-verification` tag. No tag is rendered when unset. |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Value of the Bing Webmaster `msvalidate.01` tag. No tag is rendered when unset. |

To regenerate `src/app/favicon.ico` after changing the mark in `src/lib/seo/brandMark.ts`, run the dependency-free script and commit the result:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/make-favicon.mjs
```

The share images are checked by eye: after `npm run build`, open the files named `opengraph-image` under `out/` (they have no extension, but they are PNGs). Real previews on Slack, Discord, X and LinkedIn can only be checked after deployment, with each platform's own debugger.

## Deploy

The site is a static export deployed on Vercel.

1. Import the repository in Vercel. `vercel.json` already sets the install command, the build command and the output directory `out`, so the framework preset in the dashboard does not matter.
2. Set `NEXT_PUBLIC_SITE_URL=https://claudecodemods.com` in the project's environment variables.
3. Enable Web Analytics in the Vercel dashboard for the project, then redeploy. The `@vercel/analytics` component is already in the layout and records nothing until it is enabled.
4. Security headers (Content-Security-Policy, HSTS and others) come from `vercel.json`.

`npm run build` writes a fully static site to `out/`, so any static host also works. Set `NEXT_PUBLIC_SITE_URL` to that host's origin.
