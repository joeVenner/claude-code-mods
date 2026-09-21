# Contributing

This is an unofficial community directory of Claude Code mods and extensions. It is not affiliated with or endorsed by Anthropic.

**Listing is not review.** A merged pull request means the extension is listed and its source existed when the checks ran. Nobody reviewed, scanned or tested the code it points to, and a listing is not an endorsement.

## List an extension

You add one JSON file and open a pull request. There is no form, account or backend.

1. **Fork and clone the repository.** Fork [joeVenner/claude-code-mods](https://github.com/joeVenner/claude-code-mods), then clone your fork and start a branch. Node 22 or newer is required.

   ```bash
   git clone https://github.com/<your-account>/claude-code-mods.git
   cd claude-code-mods
   git switch -c add-<slug>
   npm ci
   ```

2. **Add one file.** Create `src/data/community/<slug>.json`. It holds one entry, as a JSON object, and its name is the slug plus `.json`. Change nothing else, so that two submissions never conflict.

3. **Run the checks locally.** The first command runs the unit tests, which load every data file against the schema. The other two check your file against the network and are the same checks CI runs.

   ```bash
   npm test
   npm run catalog:verify -- --only src/data/community/<slug>.json
   npm run catalog:structure -- --only src/data/community/<slug>.json
   ```

4. **Open a pull request** against `main`. The template asks you to confirm each rule below.

5. **Wait for CI.** A workflow runs typecheck, lint, tests and a build, then runs the two catalog checks on the file you added. A failing check names the field or the URL. For a first pull request, GitHub may ask a maintainer to approve the workflow run.

6. **A maintainer reviews and merges.** A maintainer reads every submission before merging: that its text matches the source's own words, that the links work and that the rules are met. Maintainers read the text, not the code the entry points to.

7. **The site rebuilds** from `main` and the entry appears in the directory.

## Rules every submission must meet

CI checks the shape of an entry, that its URLs respond and that its manifest files exist. It cannot prove that a command or a package is safe, and a pull request runs its own copy of the checks, so they are a convenience for contributors and not a security boundary.

A maintainer reads every submission before merging, and reads the text of the entry, not the code it points to. Merged means listed. It never means reviewed or endorsed.

The schema in `src/lib/types.ts`, the loader in `src/lib/catalog.ts` and the checks in CI test the rules below, so most problems show up before a maintainer looks. Entries from the community appear with a visible "Community listing" label.

- `publisher.kind` is `"community"`.
- `isFeatured` is `false`. Only maintainers feature entries.
- `stars` is `null`. Only maintainers record star counts.
- `repositoryUrl` is on github.com and responds with HTTP 200 when the check runs.
- `availability` is `installable` or `source-only`, never `built-in`.
- A plugin or a mod has `.claude-plugin/plugin.json` at the `repositoryUrl` location. A mod also has `hooks/hooks.json` with a `modules` array.
- A mod lists at least one hooked event and includes a `guide` with a set up section and a download section, and each title contains "set up" (or "setup") and "download".
- Every command, in `installCommands`, in `details` with `isCommand` true and in `guide` commands, is one line of printable ASCII, at most 200 characters, and has one of these forms: `/plugin marketplace add <owner>/<repo>`, `/plugin install <name>@<marketplace>`, `claude --plugin-dir <path>`, or `git clone https://github.com/<owner>/<repo>` for your own repository.
- A download section that starts with that `git clone` may also use `cd` and `git sparse-checkout set`.
- `npx`, `curl`, pipes and every other command are written as prose, never as a command.
- No control, bidirectional or zero-width characters anywhere in the entry.
- The publisher name does not contain `anthropic`, `claude`, `official` or `mcp`.
- The publisher `url`, the verification `sourceUrl` and the `repositoryUrl` share one github.com owner, and that owner is not a reserved one.
- `verification.checkedAt` is not a date in the future.
- The slug is not too similar to a slug already in the directory.
- Every URL is https on an allowlisted host (`github.com` or `code.claude.com`), with no credentials and no custom port.
- One entry per file, and the file name is the slug plus `.json`.

Write descriptions from the source's own text. Do not invent versions, license names, star counts or claims about security.

## An example entry

This is an example, not a real listing. The publisher, the repository and every URL in it are invented, so the link check would report them as not found.

```json
{
  "slug": "example-format-on-save",
  "name": "Example Format on Save",
  "kind": "plugin",
  "categories": [
    "quality"
  ],
  "summary": "Runs a formatter after each file edit and reports failures back to the session.",
  "description": [
    "One paragraph per array item. Say what it does, what it needs, and anything a user should check first."
  ],
  "publisher": {
    "name": "Example publisher",
    "url": "https://github.com/example-publisher",
    "kind": "community"
  },
  "repositoryUrl": "https://github.com/example-publisher/example-format-on-save",
  "license": "MIT",
  "availability": "source-only",
  "installCommands": [],
  "notice": null,
  "details": [
    {
      "label": "Formatter",
      "value": "Any formatter on your PATH",
      "isCommand": false
    }
  ],
  "guide": [],
  "hooks": [
    "PostToolUse"
  ],
  "tags": [
    "formatting"
  ],
  "links": [
    {
      "label": "README",
      "url": "https://github.com/example-publisher/example-format-on-save/blob/main/README.md"
    }
  ],
  "stars": null,
  "isFeatured": false,
  "verification": {
    "status": "verified",
    "checkedAt": "2026-01-15",
    "sourceUrl": "https://github.com/example-publisher/example-format-on-save"
  }
}
```

### The guide

`guide` is a list of titled sections, each with paragraphs and optional commands. It is required for a mod, and these sections are invented and belong to no real mod:

```json
[
  {
    "title": "Overview",
    "paragraphs": [
      "What the mod does, which events it hooks and what a person will notice when it is loaded."
    ],
    "commands": []
  },
  {
    "title": "Setup",
    "paragraphs": [
      "What has to be enabled first, and how to load the mod from a local folder."
    ],
    "commands": [
      "claude --plugin-dir example-hook-mod"
    ]
  },
  {
    "title": "Download",
    "paragraphs": [
      "Where the source lives and how to get it."
    ],
    "commands": [
      "git clone https://github.com/example-publisher/example-hook-mod"
    ]
  }
]
```

## If your entry is a mod

A mod is a Claude Code plugin whose behaviour lives in a hooks module. Anthropic's own mods are described in the [mods README](https://github.com/anthropics/claude-code/blob/main/mods/README.md), and the typings the engine offers them are in the [mods types folder](https://github.com/anthropics/claude-code/tree/main/mods/types). Use only event names you find there.

You load a mod from a local folder, and test it, with these commands. Function hooks must be enabled for a hooks module to load.

```bash
claude --plugin-dir <path-to-mod>
claude plugin test <path-to-mod>
```

In an entry, only the first form is allowed as a command, so describe testing in prose.

This is early access: the API mods are written against may change between Claude Code releases without notice, and mods are not listed in a plugin marketplace. Say so in the entry's `notice`.

For how plugins are packaged, read the official [plugin docs](https://code.claude.com/docs/en/plugins) and [plugin marketplace docs](https://code.claude.com/docs/en/plugin-marketplaces).

## Open item: license

This repository has no LICENSE file yet. The maintainer will decide the license that applies to submitted data. Until that is decided, do not assume one.

## Review expectations

- A pull request should change one file in `src/data/community/` and nothing else. A pull request that changes files there and files elsewhere fails a path check and will be asked to split.
- Expect questions about wording, categories and links. A maintainer may ask you to change the entry before merging, or decline an entry that breaks a rule.
- Maintainers may remove an entry later if its source disappears or the entry stops matching it.

## Report a wrong or dead listing

Open an issue with the "Wrong or dead listing" template and name the entry and what is wrong.

## Change the site itself

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). Add an entry under `[Unreleased]` in `CHANGELOG.md` for changes people would notice.
