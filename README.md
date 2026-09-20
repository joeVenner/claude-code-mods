# Claude Code Mods

An unofficial community directory of Claude Code extensions: plugins, skills, agents, hooks, MCP servers, slash commands, and proposed "mods".

> Not affiliated with or endorsed by Anthropic.

## What is real and what is a concept

Every entry carries a verification status.

- **Source verified**: the entry's source URL returned HTTP 200 on the catalog date. This means the source exists. It does **not** mean the code was security reviewed.
- **Concept**: the idea is described in the marketplace specification but has no public implementation. Concepts never show a verified badge, install command, star count or repository link.

The specification's security tiers (A, B, C, revoked) are a design, not a running scanner. No listing has a tier today.

## Stack

Next.js 16 (App Router, static export), React 19, Tailwind CSS v4, strict TypeScript, Zod, Motion, Phosphor icons, Vitest and Testing Library.

## Develop

Requires Node 22 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run lint
npm test
npm run build        # static export to ./out
```

## Catalog

The catalog lives in `src/data/catalog.json` and is validated at load time against the Zod schema in `src/lib/types.ts`.

```bash
npm run catalog:verify   # re-checks every URL in the catalog, exits non-zero on any non-200
```

Pages read the catalog only through `src/lib/catalog.ts` and `src/lib/search.ts`. Nothing in the UI hardcodes entry names, counts or star numbers.

## Deploy

`npm run build` writes a fully static site to `out/`, suitable for Cloudflare Pages or any static host. Set `NEXT_PUBLIC_SITE_URL` to the production origin so canonical URLs and the sitemap are correct.
