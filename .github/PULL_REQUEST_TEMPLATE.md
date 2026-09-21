<!-- For a community submission, read CONTRIBUTING.md first. Listing is not review. -->

## What this changes

<!-- One or two sentences. For a submission: the extension's name and what it is. -->

## Submission checklist

Skip this section if the pull request does not add or change a file in `src/data/community/`.

- [ ] The pull request adds or changes one file, `src/data/community/<slug>.json`, and its name is the slug plus `.json`.
- [ ] `publisher.kind` is `"community"`, `isFeatured` is `false` and `stars` is `null`.
- [ ] `repositoryUrl` is a public github.com URL and `availability` is `installable` or `source-only`.
- [ ] Install commands, if any, are copied as written from the source.
- [ ] Every text in the entry comes from the source. I did not invent versions, licenses, star counts or security claims.
- [ ] For a plugin or a mod, `.claude-plugin/plugin.json` exists at the `repositoryUrl` location. For a mod, `hooks/hooks.json` has a `modules` array and the entry has a guide with an overview, setup and download.
- [ ] `npm test` passes.
- [ ] `npm run catalog:verify -- --only src/data/community/<slug>.json` passes.
- [ ] `npm run catalog:structure -- --only src/data/community/<slug>.json` passes.

## Other changes

- [ ] `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` pass.
- [ ] `CHANGELOG.md` has an entry under `[Unreleased]` if people would notice the change.

I understand that a merged listing means the source exists, not that anyone reviewed it.
