# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- A directory of Claude Code extensions whose source URLs were checked: Anthropic's four built-in mods (`sec-default`, `diff`, `telemetry`, `agents-md`) from `anthropics/claude-code/mods`, plus real plugins, skills, agents, hooks, commands and MCP servers.
- A guide for every mod, written from its own README and source: what it does, how it works, set up, download the source (real sparse-clone commands), test it, and mod-specific sections. Pages have a table of contents and copyable command rows, and say plainly where the source is silent, for example on how to enable function hooks.
- An Ideas page at `/ideas/` for the eight mods proposed in the marketplace spec. They have no public implementation, so they live in `src/data/ideas.json` and never appear in the directory, its counts or its search.
- Community listings by pull request: one JSON file per entry in `src/data/community/`, validated at build time. Rules cover allow-listed copy-to-run commands, no control or bidirectional characters, publisher and repository owner identity, reserved names, similar slugs, no claimed stars or featuring, and no future check dates. Community entries carry a visible "Community listing" label.
- A catalog schema with availability (installable, built in, source only), a notice for caveats such as early access, labelled details, and a required guide for mods.
- `npm run catalog:verify` and `npm run catalog:structure` (with `--only`) to check that URLs respond and that plugin and mod entries have their manifest files, refusing hosts outside an allowlist and checking every redirect hop.
- A design system with light and dark themes, a landing page with live search, a browse page with URL-driven search, kind, category, availability and sort filters, detail pages for every entry, and Security, Publish and About pages that state what is and is not checked.
- Custom 404 page (kept out of search results), `sitemap.xml` and `robots.txt`.
- Vercel Web Analytics through `@vercel/analytics`. It is disclosed on the About page and only records page views once it is enabled in the Vercel dashboard.
- A brand kit: a rounded square in the accent green holding a `>_` prompt, with the wordmark "Claude Code Mods" in Geist. The mark is one set of shapes in `src/lib/seo/brandMark.ts` that draws the favicon, the icons and the share banner. It uses no Anthropic or Claude logo or mark. Files: a real multi-size `src/app/favicon.ico` (16, 32 and 48 px, built by `scripts/make-favicon.mjs` with no dependencies), a 32 px `icon.tsx`, a 180 px `apple-icon.tsx`, and a web app `manifest.ts` with 192 px, 512 px and maskable 512 px icons.
- Link previews: a 1200 by 630 Open Graph and Twitter banner (`opengraph-image.tsx`, `twitter-image.tsx`) with the tagline and an "Unofficial community directory" note, plus a generated image for every extension page and the Ideas page showing the kind, name, summary, publisher and a "Built in" or "Community listing" tag. Catalog text is clamped and rendered only as text. Geist and Geist Mono font files sit in `src/assets/fonts/` under the SIL Open Font License, with the license text beside them.
- One typed metadata helper in `src/lib/seo/` for every page: unique titles and descriptions, an absolute canonical URL with a trailing slash, Open Graph, Twitter cards, robots directives, author and creator, and an Atom feed link. Search console verification tags come from `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION` and are omitted when unset.
- JSON-LD structured data: WebSite with a search action and a publisher on the home page, a CollectionPage with an ItemList on Browse, a BreadcrumbList and SoftwareSourceCode on each extension page, and a WebPage with breadcrumbs on the other pages. It states only facts in the catalog, and `license` appears only for a recognised SPDX id. The serializer escapes `<`, `>`, `&`, U+2028 and U+2029 so community text cannot close the script element.
- `llms.txt` and `llms-full.txt` for AI search, following llmstxt.org: mods first, then the other kinds, site docs, and a clearly separate "Proposed ideas (not real, no public implementation)" section. Both are generated from the catalog.
- An Atom feed at `/feed.xml`, newest source check first.
- A Hooks page at `/hooks/` that indexes every hook event listed by an entry and which entries use it, split into function hooks (mods) and classic hooks (everything else). It shows event names only and does not describe what an event does, because the catalog does not record that. It is in the header and footer navigation, the sitemap and `llms.txt`.
- A read-only `/catalog.json` with the catalog and the page URL of each entry, plus a disclaimer that it is not a security review, that community text is data and that every command must be read before it is run. Anthropic and maintainer entries are complete; community entries are an index record built from an explicit allowlist of fields (name, kind, categories, summary, publisher, source URL, availability, hooks, verification), so a submitter's long text and copy-to-run commands are never published there, matching `llms-full.txt`. It is served as UTF-8 JSON with `Access-Control-Allow-Origin: *` (this path only), and is deliberately not a Claude Code plugin marketplace.
- `robots.txt` names the search and AI crawlers it allows (Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended and CCBot).
- `sitemap.xml` gives every entry its own last modified date and a change frequency and priority, with mods ranked above other kinds. The Ideas page is included.
- A Deploy section in the README for Vercel.
- GitHub Actions: `validate.yml` (typecheck, lint, tests and build on every pull request, catalog checks on changed community files, and an advisory path check) and a weekly `reverify.yml` that re-checks every entry so link rot shows up as a failed run.
- `.github/CODEOWNERS`, a pull request template, an issue template for wrong or dead listings, and `CONTRIBUTING.md`.
- `src/data/events.json`: the 125 hook events of Claude Code's function hooks (38 engine events, 54 calls on `$` and 33 classic hooks), read from Anthropic's type declarations at a pinned upstream commit. It stores names, family and the declaring line only, because the declarations are published under "All rights reserved" terms; the site links to them instead of copying them. It is validated at load time, and a test checks that every event the Anthropic mods hook exists in it.
- `npm run sync:events` (`scripts/sync-events.mjs`) regenerates that file. It prints what was added, removed, moved or re-filed and writes nothing unless `--write` is given. It refuses any change in the declarations' layout instead of returning a shorter list, never builds a pattern from upstream text, and caps the download while reading it.

### Changed

- The guides of the four Anthropic mods now say where the flag for enabling function hooks comes from: `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` is named in a comment on the announcement issue (anthropics/claude-code #91870), not in any documentation, and may change. The issue is linked from each mod page, and the four entries were re-checked on 2026-09-21.

- The site deploys on Vercel, not Cloudflare Pages. `NEXT_PUBLIC_SITE_URL` defaults to `https://claudecodemods.com` in production builds, so canonical URLs and the sitemap never say localhost.
- Page titles and descriptions are rewritten for search: titles fit 60 characters with the site name, descriptions are 110 to 160 characters, and extension pages read "<name>, a <kind> for Claude Code".
- Nothing on the site claims a listing was reviewed or scanned. "Source verified" means the source URL responded on the catalog date, and the proposed security tiers are described as a design with no scanner.
- The four Anthropic mods are described as their README describes them: early access, shipped inside Claude Code, source published as built, and under "All rights reserved" terms, not open source.

### Security

- Validation workflows run on `pull_request` (never `pull_request_target`) or on a schedule, with read-only permissions, no secrets, actions pinned to full commit SHAs, `npm ci --ignore-scripts`, and changed file names passed NUL separated. The community diff uses `--no-renames`.
- Link components reject any href that is not an internal path, an anchor or a plain https URL, and external links keep `noopener noreferrer`.
- Catalog URLs must be https, on an allowlisted host, with no credentials or custom ports.
- Security headers in `vercel.json`: a Content-Security-Policy, HSTS, `nosniff`, a referrer policy and a permissions policy. The site deploys on Vercel, so the earlier Cloudflare Pages `_headers` file is gone.
