import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ComparisonTable } from "@/components/docs/ComparisonTable";
import { DefinitionList } from "@/components/docs/DefinitionList";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { InlineCode } from "@/components/docs/InlineCode";
import { SourceLine } from "@/components/docs/SourceLine";
import { TextLink } from "@/components/docs/TextLink";
import {
  CLASSIC_DIFFERENCES,
  CLASSIC_SETTINGS_JSON,
  CLASSIC_SHELL_GUARD,
  ENGINE_COUNTERPARTS,
  ENGINE_COUNTERPART_COLUMNS,
  HOW_CHECKED,
  NO_OFFICIAL_GUIDE,
  PLUGIN_DEV_MIGRATION_URL,
  RESULT_MAPPING,
  RESULT_MAPPING_COLUMNS,
  SCOPE_NOTE,
} from "@/components/docs/migrationContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { eventAnchorId } from "@/lib/event-names";
import { getEvents, getEventsSource } from "@/lib/events";
import { loadMigrationExampleFiles, MIGRATION_EXAMPLE_DIRECTORY } from "@/lib/migration-example";
import { buildDocPageGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import { COMMUNITY_REPOSITORY_URL } from "@/lib/site";

export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.learnMigration);

const HOOKS_PAGE = PAGE_SEO.hooks.path;

function hooksRowHref(eventName: string): string {
  return `${HOOKS_PAGE}#${eventAnchorId(eventName)}`;
}

export default function MigrationPage(): ReactNode {
  const source = getEventsSource();
  const classicEvents = getEvents().filter((event) => event.family === "classic");
  const [registerFile] = loadMigrationExampleFiles();

  return (
    <DocPage
      title="Classic hooks to function hooks"
      description="How a hook you already have as a shell command maps onto a function hook in a mod."
    >
      <JsonLd data={buildDocPageGraph(PAGE_SEO.learnMigration)} />
      <Callout>
        <p>{NO_OFFICIAL_GUIDE}</p>
        <p>{SCOPE_NOTE}</p>
        <p>
          Read the <TextLink href={PLUGIN_DEV_MIGRATION_URL}>plugin-dev migration guide</TextLink> if you want to move a
          command hook to a prompt hook instead. Function hooks are early access, and the API may change between
          releases without notice.
        </p>
      </Callout>
      <DocSection id="what-changes" title="What changes">
        <DefinitionList
          items={CLASSIC_DIFFERENCES.map((difference) => ({
            id: difference.id,
            term: difference.term,
            description: (
              <>
                <p>{difference.description}</p>
                <SourceLine sources={difference.sources} />
              </>
            ),
          }))}
        />
      </DocSection>
      <DocSection id="two-routes" title="Two ways to move a hook">
        <Prose>
          <p>
            You can keep the event you already hook. Every classic event is also a function hooks event named{" "}
            <InlineCode>classic.&lt;Name&gt;</InlineCode>, so <InlineCode>PreToolUse</InlineCode> becomes{" "}
            <InlineCode>classic.PreToolUse</InlineCode>, and a hook on it keeps the classic results.
          </p>
          <p>
            Or you can hook the engine&apos;s own event that surrounds it, such as <InlineCode>tool.call</InlineCode>,
            which has its own results, including answering a call yourself. This page does not recommend one over the
            other: the first keeps the classic results you already know.
          </p>
        </Prose>
      </DocSection>
      <DocSection id="results" title="Exit codes and JSON become returns">
        <Prose>
          <p>
            A command hook talks through its exit code and the JSON it prints. A function hook returns a value, and
            that value carries the same decisions. Read each row from left to right.
          </p>
        </Prose>
        <ComparisonTable
          caption="A classic command hook's output and the value a function hook returns"
          columns={RESULT_MAPPING_COLUMNS}
          rows={RESULT_MAPPING.map((mapping) => ({
            id: mapping.id,
            header: mapping.classic,
            cells: [mapping.functionHook, <SourceLine key="source" sources={mapping.sources} />],
          }))}
        />
      </DocSection>
      <DocSection id="engine-events" title="The engine events around them">
        <Prose>
          <p>
            For four classic events, the declarations relate an engine event to it: sharing its envelope, running its
            settings hooks through <InlineCode>next</InlineCode>, or answering the same way when either blocks. These
            are those four pairs. An engine event with no documented link to a classic one is not listed.
          </p>
        </Prose>
        <ComparisonTable
          caption="Classic events and the engine events that surround them"
          columns={ENGINE_COUNTERPART_COLUMNS}
          rows={ENGINE_COUNTERPARTS.map((pair) => ({
            id: pair.id,
            header: <InlineCode>{pair.classicEvent}</InlineCode>,
            cells: [
              <TextLink key="engine" href={hooksRowHref(pair.engineEvent)}>
                {pair.engineEvent}
              </TextLink>,
              pair.whatAFunctionHookCanDo,
            ],
          }))}
        />
      </DocSection>
      <DocSection id="example" title="A worked example">
        <Prose>
          <p>
            A classic <InlineCode>PreToolUse</InlineCode> hook that blocks <InlineCode>rm</InlineCode>. The script reads
            the event from stdin and exits 2 with its reason on stderr, and the configuration attaches it to Bash calls.
          </p>
        </Prose>
        <CodeBlock code={CLASSIC_SHELL_GUARD} filename=".claude/hooks/block-rm.sh" />
        <CodeBlock code={CLASSIC_SETTINGS_JSON} filename=".claude/settings.json" />
        <Prose>
          <p>
            As a function hook on the same event, the exit 0 becomes <InlineCode>next(e)</InlineCode> and the exit 2
            becomes <InlineCode>{"{ deny }"}</InlineCode>. The same file also moves a <InlineCode>Stop</InlineCode>{" "}
            hook, whose exit 2 becomes <InlineCode>{"{ block }"}</InlineCode>, and a{" "}
            <InlineCode>UserPromptSubmit</InlineCode> hook that adds context. To hook the engine&apos;s own event
            instead, see the <TextLink href="/learn/getting-started/">starter mod</TextLink>, which refuses a Bash call
            from <InlineCode>tool.call</InlineCode>.
          </p>
        </Prose>
        <CodeBlock code={registerFile.content} filename={`${MIGRATION_EXAMPLE_DIRECTORY}/${registerFile.path}`} />
        <Prose>
          <p>
            The folder also holds a manifest and a <InlineCode>hooks/hooks.json</InlineCode> with the same shape as the
            starter&apos;s. It is this site&apos;s own example, in{" "}
            <TextLink href={`${COMMUNITY_REPOSITORY_URL}/tree/main/${MIGRATION_EXAMPLE_DIRECTORY}`}>
              {MIGRATION_EXAMPLE_DIRECTORY}
            </TextLink>
            , and not one of Anthropic&apos;s mods.
          </p>
        </Prose>
      </DocSection>
      <DocSection id="classic-events" title="The classic events">
        <Prose>
          <p>
            Function hooks name {classicEvents.length} classic events. Each links to its row on the{" "}
            <TextLink href={HOOKS_PAGE}>Hooks page</TextLink>, with the entries that list it.
          </p>
        </Prose>
        <ul role="list" className="flex max-w-3xl flex-wrap gap-x-4 gap-y-2 text-sm">
          {classicEvents.map((event) => (
            <li key={event.name}>
              <TextLink href={hooksRowHref(event.name)}>{event.name}</TextLink>
            </li>
          ))}
        </ul>
      </DocSection>
      <DocSection id="how-checked" title="How this page was checked">
        <Prose>
          <p>
            Against Anthropic&apos;s type declarations at commit <InlineCode>{source.sha.slice(0, 7)}</InlineCode>
            {source.claudeCodeVersion === null ? "" : ` (Claude Code ${source.claudeCodeVersion})`}, read on{" "}
            {source.syncedAt}, the same commit the <TextLink href={HOOKS_PAGE}>Hooks page</TextLink> is read at:
          </p>
          <ul role="list" className="flex list-disc flex-col gap-2 pl-5">
            {HOW_CHECKED.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>To repeat the checks, run these from a clone of this site&apos;s repository:</p>
        </Prose>
        <CopyCommand command="npm run typecheck:templates" label="Typecheck the templates against the declarations (needs the network)" />
        <CopyCommand
          command={`CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin validate ${MIGRATION_EXAMPLE_DIRECTORY}`}
          label="Validate the example mod's manifest and hooks module"
        />
      </DocSection>
    </DocPage>
  );
}
