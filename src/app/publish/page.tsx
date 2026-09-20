import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { DefinitionList } from "@/components/docs/DefinitionList";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import { buildPageMetadata } from "@/components/docs/pageMetadata";
import {
  ENTRY_FIELD_DOCS,
  ENTRY_FIELD_GROUPS,
  EXAMPLE_ENTRY,
  EXAMPLE_ENTRY_JSON,
  PLUGIN_DOCS_LINKS,
  PROPOSED_PUBLISH_API,
} from "@/components/docs/publishContent";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = buildPageMetadata({
  title: "Publish",
  description:
    "How listing works on this directory: submissions are not open, what a catalog entry contains, and where to learn how real plugins are packaged.",
  path: "/publish/",
});

export default function PublishPage(): ReactNode {
  return (
    <DocPage
      title="How listing works"
      description="Submissions are not open. This page shows what a catalog entry contains and where real plugin packaging is documented."
    >
      <DocSection id="status" title="Submissions are closed">
        <Callout tone="warning">
          <p>
            There is no submission form, account system or backend behind this site. Nothing you type here is sent
            anywhere, because there is nothing to type into.
          </p>
        </Callout>
        <Prose>
          <p>
            Entries are added by editing one data file, <InlineCode>src/data/catalog.json</InlineCode>, in the
            repository this site is built from. Each entry must pass a schema check when the site builds, and its links
            are checked with <InlineCode>npm run catalog:verify</InlineCode>.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="entry-fields" title="What a catalog entry contains">
        <Prose>
          <p>
            These fields are generated from the schema the site validates against, so the list below is the whole
            contract. Concepts follow stricter rules: no repository link, no install commands and no stars.
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
            Example, not a real listing. The slug <InlineCode>{EXAMPLE_ENTRY.slug}</InlineCode> and every URL in it are
            placeholders and would fail the link check.
          </figcaption>
          <pre
            tabIndex={0}
            aria-label="Example catalog entry as JSON"
            className="max-w-full overflow-x-auto rounded-panel border border-border bg-surface p-4 font-mono text-sm leading-relaxed text-fg"
          >
            <code>{EXAMPLE_ENTRY_JSON}</code>
          </pre>
        </figure>
      </DocSection>

      <DocSection id="packaging" title="How real plugins are packaged">
        <Prose>
          <p>
            This site does not package or host anything. How Claude Code plugins and plugin marketplaces are built and
            distributed is documented by Claude Code itself, and that documentation is the source to follow.
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

      <DocSection id="proposed-api" title="Proposed publish API, not available">
        <Callout tone="warning">
          <p>Proposed, not available. This API exists only in the marketplace spec. No server implements it.</p>
        </Callout>
        <Prose>
          <p>
            The spec describes a registry that accepts signed packages and queues them for the scan pipeline described
            on the <TextLink href="/security/#tier-model">Security page</TextLink>. If it were built, publishing would
            look like this.
          </p>
        </Prose>
        <DefinitionList
          items={PROPOSED_PUBLISH_API.map((row) => ({
            id: row.id,
            term: row.term,
            description: <p className="break-words font-mono text-sm text-fg">{row.value}</p>,
          }))}
        />
      </DocSection>
    </DocPage>
  );
}
