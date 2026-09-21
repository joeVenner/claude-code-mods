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
- Custom 404 page, `sitemap.xml` and `robots.txt`.
- GitHub Actions: `validate.yml` (typecheck, lint, tests and build on every pull request, catalog checks on changed community files, and an advisory path check) and a weekly `reverify.yml` that re-checks every entry so link rot shows up as a failed run.
- `.github/CODEOWNERS`, a pull request template, an issue template for wrong or dead listings, and `CONTRIBUTING.md`.

### Changed

- Nothing on the site claims a listing was reviewed or scanned. "Source verified" means the source URL responded on the catalog date, and the proposed security tiers are described as a design with no scanner.
- The four Anthropic mods are described as their README describes them: early access, shipped inside Claude Code, source published as built, and under "All rights reserved" terms, not open source.

### Security

- Validation workflows run on `pull_request` (never `pull_request_target`) or on a schedule, with read-only permissions, no secrets, actions pinned to full commit SHAs, `npm ci --ignore-scripts`, and changed file names passed NUL separated. The community diff uses `--no-renames`.
- Link components reject any href that is not an internal path, an anchor or a plain https URL, and external links keep `noopener noreferrer`.
- Catalog URLs must be https, on an allowlisted host, with no credentials or custom ports.
- Cloudflare Pages `_headers` with a Content-Security-Policy, HSTS, `nosniff`, a referrer policy, a permissions policy and immutable caching for static assets.
