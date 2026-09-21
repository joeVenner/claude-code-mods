import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { CodeBlock } from "@/components/docs/CodeBlock";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import {
  FUNCTION_HOOKS_FLAG,
  HOOKS_ENVIRONMENT_LIMITS,
  LEARN_SOURCES,
  MOD_FOLDER_TREE,
  RUN_WARNING,
  STARTER_LIMITS,
  TEST_KIT_NOTES,
  TESTED_WITH,
} from "@/components/docs/learnContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { buildDocPageGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import { COMMUNITY_REPOSITORY_URL } from "@/lib/site";
import { STARTER_MOD_DIRECTORY, loadStarterModFiles } from "@/lib/starter-mod";

export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.learnGettingStarted);

export default function GettingStartedPage(): ReactNode {
  const starterFiles = loadStarterModFiles();

  return (
    <DocPage
      title="Build your first Claude Mod"
      description="Turn on function hooks, then test and run a small starter mod that refuses force pushes."
    >
      <JsonLd data={buildDocPageGraph(PAGE_SEO.learnGettingStarted)} />
      <Callout tone="warning">
        <p>
          Function hooks are early access, and Anthropic says the API may change between releases without notice. The
          commands here were run with Claude Code {TESTED_WITH.claudeCodeVersion} on {TESTED_WITH.date}. If your version
          is newer, check them against the <TextLink href={LEARN_SOURCES.modsReadme}>Mods README</TextLink>.
        </p>
      </Callout>
      <DocSection id="enable" title="Turn function hooks on">
        <Prose>
          <p>Hooks modules load only where function hooks are enabled. Start Claude Code with this environment variable set:</p>
        </Prose>
        <CopyCommand command={`${FUNCTION_HOOKS_FLAG} claude`} label="Start Claude Code with function hooks on" />
        <Prose>
          <p>
            The flag is named in the Sep 9 update of the <TextLink href={LEARN_SOURCES.announcementIssue}>announcement issue</TextLink>,
            not in documentation, so it may change. Put it in front of each command that needs it, as the examples below
            do, instead of exporting it. On Claude Code {TESTED_WITH.claudeCodeVersion},{" "}
            <InlineCode>claude plugin test</InlineCode> does not exist until the variable is set (the command answers{" "}
            <InlineCode>unknown command &apos;test&apos;</InlineCode>), while <InlineCode>claude plugin validate</InlineCode>{" "}
            works either way.
          </p>
        </Prose>
      </DocSection>
      <DocSection id="folder" title="What a mod folder holds">
        <Prose>
          <p>
            A mod folder is a complete plugin: a manifest, a <InlineCode>hooks/hooks.json</InlineCode> that names the
            hooks module, TypeScript under <InlineCode>hooks/</InlineCode>, and tests.
          </p>
        </Prose>
        <CodeBlock code={MOD_FOLDER_TREE} label="Folder layout of the starter mod" />
        <Prose>
          <p>The hooks module runs in an environment of its own:</p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {HOOKS_ENVIRONMENT_LIMITS.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </Prose>
      </DocSection>
      <DocSection id="starter" title="The starter mod">
        <Prose>
          <p>
            <InlineCode>block-force-push</InlineCode> refuses a Bash call that force pushes with git and passes every
            other tool call to the hooks beneath it. <InlineCode>on(&apos;tool.call&apos;, …)</InlineCode> hooks the
            engine&apos;s event for a tool call, <InlineCode>e.tool === &apos;Bash&apos;</InlineCode> narrows{" "}
            <InlineCode>e</InlineCode> so <InlineCode>e.command</InlineCode> is a string, returning{" "}
            <InlineCode>{"{ deny }"}</InlineCode> refuses the call, and <InlineCode>next(e)</InlineCode> lets it
            through. The files below are read from{" "}
            <TextLink href={`${COMMUNITY_REPOSITORY_URL}/tree/main/${STARTER_MOD_DIRECTORY}`}>{STARTER_MOD_DIRECTORY}</TextLink>{" "}
            in this site&apos;s repository when the site is built, and they passed the tests below on Claude Code{" "}
            {TESTED_WITH.claudeCodeVersion} on {TESTED_WITH.date}. The commands on this page run from the root of a clone
            of that repository:
          </p>
        </Prose>
        <CopyCommand command={`git clone ${COMMUNITY_REPOSITORY_URL}.git`} label="Clone the repository" />
        <CopyCommand command="cd claude-code-mods" label="Go to the root of the clone" />
        <div className="flex flex-col gap-6">
          {starterFiles.map((file) => (
            <CodeBlock key={file.path} filename={file.path} code={file.content} />
          ))}
        </div>
        <Callout>
          <p>{STARTER_LIMITS}</p>
        </Callout>
      </DocSection>
      <DocSection id="test" title="Test it">
        <Callout tone="warning">
          {RUN_WARNING.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Callout>
        <CopyCommand command={`${FUNCTION_HOOKS_FLAG} claude plugin test ${STARTER_MOD_DIRECTORY}`} label="Run the starter's tests" />
        <Prose>
          <p>All of the starter&apos;s tests passed on Claude Code {TESTED_WITH.claudeCodeVersion}. What to know about the test kit:</p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {TEST_KIT_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Prose>
      </DocSection>
      <DocSection id="run" title="Check it and run it">
        <CopyCommand command={`claude plugin validate ${STARTER_MOD_DIRECTORY}`} label="Validate the manifest and the hooks module" />
        <CopyCommand command={`${FUNCTION_HOOKS_FLAG} claude --plugin-dir ${STARTER_MOD_DIRECTORY}`} label="Run Claude Code with the mod loaded from source" />
        <Prose>
          <p>
            <InlineCode>validate</InlineCode> reads the manifest and the module the way the engine will. For the
            starter it reports that the module hooks <InlineCode>tool.call</InlineCode> and calls nothing on{" "}
            <InlineCode>$</InlineCode>. The starter was checked by its tests and by <InlineCode>validate</InlineCode>; it
            was not run in a live session for this page.
          </p>
        </Prose>
      </DocSection>
      <DocSection id="types" title="Get the types">
        <Prose>
          <p>
            Inside a session, the <InlineCode>/plugin-types</InlineCode> command writes the type declarations that a
            mod imports from <InlineCode>claude-code</InlineCode>. TypeScript 5.4 or newer reads them. Regenerate them
            after every Claude Code update instead of editing them.
          </p>
        </Prose>
      </DocSection>
      <DocSection id="next" title="Where to go next">
        <Prose>
          <p>
            Read how the four built-in mods are written in the <TextLink href="/browse/?kind=mod">directory</TextLink>,
            look up an event on the <TextLink href="/hooks/">Hooks page</TextLink>, and see{" "}
            <TextLink href="/learn/">what a mod is and how it compares with plugins, hooks and skills</TextLink>.
          </p>
        </Prose>
      </DocSection>
    </DocPage>
  );
}
