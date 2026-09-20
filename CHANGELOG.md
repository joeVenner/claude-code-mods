# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Validated extension catalog of 39 entries: 31 real plugins, skills, agents, hooks, commands and MCP servers whose source URLs were checked, plus 8 clearly labeled concepts from the marketplace specification that have no public implementation.
- Catalog schema that enforces the honesty rules at build time: concepts never carry a repository link, install command, star count, links or a featured flag, and only concepts use the `mod` kind.
- URL policy for catalog data: https only, allowlisted hosts (`github.com`, `code.claude.com`), no embedded credentials or custom ports.
- `npm run catalog:verify` to re-check every catalog URL, refusing non-allowlisted hosts and validating each redirect hop.
- Design system and app shell with light and dark themes, a single phosphor-green accent, a manual theme toggle, skip link, responsive header with a mobile menu, and a footer carrying the non-affiliation notice.
- Landing page with a live search over the catalog, a kind explorer, featured listings, real install commands taken from each listing, and a plain explanation of what each label means.
- Browse page with URL-driven search, kind, category, status and sort filters, facet counts, a `/` shortcut to focus search, and loading, empty and no-match states.
- Extension detail pages for every catalog entry, with install commands, lifecycle hooks, links, related entries and a verification note.
- Security page presenting the proposed tier model and scan pipeline, stating plainly that no scanner runs and no listing has a tier.
- Publish page describing the catalog entry format from the real schema (submissions are not open), and an About page covering provenance and the unofficial status of the directory.
- Custom 404 page, `sitemap.xml` and `robots.txt`.

### Security

- Cloudflare Pages `_headers` with a Content-Security-Policy, HSTS, `nosniff`, a referrer policy, a permissions policy and immutable caching for static assets.
- Link components reject any href that is not an internal path, an anchor or a plain https URL, and external links always keep `noopener noreferrer`.
