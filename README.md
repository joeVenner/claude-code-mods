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

## Deploy

`npm run build` writes a fully static site to `out/`, suitable for Cloudflare Pages or any static host. Set `NEXT_PUBLIC_SITE_URL` to the production origin so canonical URLs and the sitemap are correct.
