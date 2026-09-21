import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { DefinitionList } from "@/components/docs/DefinitionList";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import { Timeline } from "@/components/docs/Timeline";
import { buildPageMetadata } from "@/components/docs/pageMetadata";
import {
  COMMUNITY_FILE_PATTERN,
  COMMUNITY_LABEL,
  ENTRY_FIELD_DOCS,
  ENTRY_FIELD_GROUPS,
  EXAMPLE_ENTRY,
  EXAMPLE_ENTRY_JSON,
  EXAMPLE_GUIDE_JSON,
  LICENSE_OPEN_ITEM,
  MODS_LOADING_COMMANDS,
  MODS_README_URL,
  MODS_TYPES_URL,
  PLUGIN_DOCS_LINKS,
  PUBLISH_STEPS,
  RULES_FRAMING,
  SUBMISSION_RULES,
} from "@/components/docs/publishContent";
import { Button } from "@/components/ui/Button";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { COMMUNITY_REPOSITORY_URL } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Publish",
  description:
    "List a Claude Code extension or mod by pull request: the steps, the rules a submission cannot bypass, the entry format and what a listing means.",
  path: "/publish/",
});

function CodeBlock({ label, children }: { readonly label: string; readonly children: string }): ReactNode {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className="max-w-full overflow-x-auto rounded-panel border border-border bg-surface p-4 font-mono text-sm leading-relaxed text-fg"
    >
      <code>{children}</code>
    </pre>
  );
}

export default function PublishPage(): ReactNode {
  return (
    <DocPage
      title="Publish an extension"
      description="List your Claude Code extension or mod with a pull request. A listing says the source exists, not that anyone reviewed it."
    >
      <DocSection id="how-it-works" title="How listing works">
        <Callout tone="note">
          <p>
            There is no submission form, account system or backend behind this site. Nothing you type here is sent
            anywhere.
          </p>
        </Callout>
        <Prose>
          <p>
            You add one JSON file to the public repository at{" "}
            <TextLink href={COMMUNITY_REPOSITORY_URL}>joeVenner/claude-code-mods</TextLink> and open a pull request.
            Automated checks run on it, a maintainer reads it, and the site is rebuilt after it merges.
          </p>
          <p>
            This page describes the process the repository is set up for. If the repository&apos;s own{" "}
            <InlineCode>CONTRIBUTING.md</InlineCode> differs from this page, follow that file.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="steps" title="From fork to listing">
        <Timeline items={PUBLISH_STEPS} label="Steps to list an extension" />
      </DocSection>

      <DocSection id="what-a-listing-means" title="What a listing means">
        <Prose>
          <p>
            A merged pull request means the extension is listed and its source existed when the checks ran. It does not
            mean anyone reviewed, scanned or tested the code, and it is not an endorsement by the maintainers or by
            Anthropic.
          </p>
          <p>
            The two catalog checks are narrow on purpose. The link check asks whether each URL responds. The structure
            check asks whether the manifest files exist and parse. Neither reads what the code does. To decide whether
            something is safe to install, use the checks on the <TextLink href="/security/">Security page</TextLink>.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="rules" title="Rules every submission must meet">
        <Prose>
          {RULES_FRAMING.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            The schema, the catalog loader and the checks in CI test the rules below, so most problems show up before a
            maintainer looks. Entries from the community appear with a visible &quot;{COMMUNITY_LABEL}&quot; label.
          </p>
        </Prose>
        <ul className="flex max-w-[65ch] flex-col divide-y divide-border border-y border-border">
          {SUBMISSION_RULES.map((rule) => (
            <li key={rule.id} className="py-3 text-base leading-relaxed text-fg">
              {rule.rule}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="entry-fields" title="What an entry contains">
        <Prose>
          <p>
            One file holds one entry, and it lives at <InlineCode>{COMMUNITY_FILE_PATTERN}</InlineCode>. The fields
            below come from the schema the site validates against, so this list is the whole contract.
          </p>
        </Prose>
        <div className="flex flex-col gap-10">
          {ENTRY_FIELD_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold tracking-tight text-fg">{group.title}</h3>
              <DefinitionList
                items={group.fields.map((field) => ({
                  id: field,
                  term: <span className="font-mono text-sm">{field}</span>,
                  description: (
                    <>
                      <p>{ENTRY_FIELD_DOCS[field].description}</p>
                      <p className="break-words font-mono text-xs text-fg-muted">{ENTRY_FIELD_DOCS[field].type}</p>
                      {ENTRY_FIELD_DOCS[field].submissionRule ? (
                        <p className="text-fg">
                          <span className="font-medium">In a submission: </span>
                          {ENTRY_FIELD_DOCS[field].submissionRule}
                        </p>
                      ) : null}
                    </>
                  ),
                }))}
              />
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="example-entry" title="An example entry">
        <figure className="flex min-w-0 flex-col gap-3">
          <figcaption className="max-w-[65ch] text-sm leading-relaxed text-fg-muted">
            Example, not a real listing. The slug <InlineCode>{EXAMPLE_ENTRY.slug}</InlineCode>, the publisher and every
            URL in it are invented, and the link check would report them as not found.
          </figcaption>
          <CodeBlock label="Example catalog entry as JSON">{EXAMPLE_ENTRY_JSON}</CodeBlock>
        </figure>
        <Prose>
          <p>
            A guide is a list of titled sections, each with paragraphs and optional commands. For a mod it is required,
            with at least an overview, a setup section and a download section. The sections below are invented and
            belong to no real mod.
          </p>
        </Prose>
        <figure className="flex min-w-0 flex-col gap-3">
          <figcaption className="max-w-[65ch] text-sm leading-relaxed text-fg-muted">
            Example guide, not from a real mod.
          </figcaption>
          <CodeBlock label="Example guide as JSON">{EXAMPLE_GUIDE_JSON}</CodeBlock>
        </figure>
      </DocSection>

      <DocSection id="mods" title="If your entry is a mod">
        <Prose>
          <p>
            A mod is a Claude Code plugin whose behaviour lives in a hooks module. Anthropic&apos;s own mods are
            described in <TextLink href={MODS_README_URL}>the mods README</TextLink>, and the typings the engine offers
            them are in <TextLink href={MODS_TYPES_URL}>the mods types folder</TextLink>. Use only event names you find
            there.
          </p>
          <p>
            You load a mod from a local folder, and test it, with these commands. Function hooks must be enabled for a
            hooks module to load. In an entry, only the first form is allowed as a command, so describe testing in
            prose.
          </p>
        </Prose>
        <div className="flex max-w-[65ch] flex-col gap-2">
          {MODS_LOADING_COMMANDS.map((command) => (
            <CopyCommand key={command} command={command} />
          ))}
        </div>
        <Callout tone="warning">
          <p>
            Early access. The API mods are written against may change between Claude Code releases without notice, and
            mods are not listed in a plugin marketplace. Say so in the entry&apos;s <InlineCode>notice</InlineCode>.
          </p>
        </Callout>
      </DocSection>

      <DocSection id="license" title="Open item: license for submitted data">
        <Prose>
          <p>{LICENSE_OPEN_ITEM}</p>
        </Prose>
      </DocSection>

      <DocSection id="packaging" title="How plugins are packaged">
        <Prose>
          <p>
            This site does not package or host anything. Claude Code documents how plugins and plugin marketplaces are
            built and distributed, and that documentation is the source to follow.
          </p>
        </Prose>
        <ul className="flex flex-wrap gap-3">
          {PLUGIN_DOCS_LINKS.map((link) => (
            <li key={link.url}>
              <Button
                variant="secondary"
                href={link.url}
                iconRight={<ArrowSquareOut size={16} weight="regular" aria-hidden="true" />}
              >
                {link.label}
              </Button>
            </li>
          ))}
        </ul>
      </DocSection>
    </DocPage>
  );
}
