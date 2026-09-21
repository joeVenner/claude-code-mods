import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Callout } from "@/components/docs/Callout";
import { DefinitionList } from "@/components/docs/DefinitionList";
import { DocPage } from "@/components/docs/DocPage";
import { DocSection, Prose } from "@/components/docs/DocSection";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import { repositoryNameOf, selectAnthropicBuiltInMods, sharedNotice } from "@/components/docs/builtInMods";
import { CopyCommand } from "@/components/ui/CopyCommand";
import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { getIdeas } from "@/lib/ideas";
import { DISCLAIMER, VERIFICATION_NOTE } from "@/lib/site";
import type { ExtensionKind } from "@/lib/types";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildDocPageGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.about);

type OtherKind = Exclude<ExtensionKind, "mod">;

/** Typed over every kind except mod, so a new kind cannot be added without a line here. */
const OTHER_KIND_NOTES: Readonly<Record<OtherKind, { readonly term: string; readonly description: string }>> = {
  plugin: {
    term: "Plugin",
    description: "A package that can bundle commands, agents, skills, hooks and MCP servers, installed from a plugin marketplace.",
  },
  skill: { term: "Skill", description: "A folder with a SKILL.md file that teaches Claude how to do one kind of task." },
  agent: { term: "Agent", description: "A subagent defined in a markdown file, with its own prompt and its own tools." },
  hook: { term: "Hook", description: "A command that Claude Code runs on its own when a lifecycle event fires." },
  "mcp-server": {
    term: "MCP server",
    description: "A Model Context Protocol server that gives Claude access to tools and data, added with claude mcp add.",
  },
  command: { term: "Command", description: "A slash command defined in a markdown file." },
};

export default function AboutPage(): ReactNode {
  const extensions = getAllExtensions();
  const mods = extensions.filter((extension) => extension.kind === "mod");
  const builtInMods = selectAnthropicBuiltInMods(extensions);
  const builtInRepository = builtInMods.length > 0 ? repositoryNameOf(builtInMods[0].repositoryUrl) : null;
  const builtInNotice = sharedNotice(builtInMods);
  const ideaCount = getIdeas().length;
  const generatedAt = getCatalogGeneratedAt();

  return (
    <DocPage
      title="About this directory"
      description="A community-run directory of Claude Code mods and extensions, with a plain record of what was checked."
    >
      <JsonLd data={buildDocPageGraph(PAGE_SEO.about)} />
      <DocSection id="unofficial" title="Unofficial, and not a security service">
        <Callout tone="note">
          <p>{DISCLAIMER}</p>
        </Callout>
        <Prose>
          <p>
            This site does not host, package or run any extension. Each entry points to the publisher&apos;s own source.
            Listing something here is not an endorsement and not a safety claim, and nothing on this site says a listing
            was reviewed or scanned.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="mods" title="What a mod is">
        <Prose>
          <p>
            A mod is a Claude Code plugin whose behaviour lives in a hooks module: one{" "}
            <InlineCode>register(on, options)</InlineCode> entry that hooks the engine&apos;s events as functions.
          </p>
          {builtInMods.length > 0 ? (
            <p>
              Anthropic publishes {builtInMods.length} {builtInMods.length === 1 ? "mod" : "mods"} that ship inside
              Claude Code
              {builtInRepository ? <>, with their source in the {builtInRepository} repository</> : null}.
            </p>
          ) : null}
          {builtInNotice ? <p>Their listings carry this notice: {builtInNotice}</p> : null}
        </Prose>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {mods.map((mod) => (
            <li key={mod.slug} className="font-mono text-sm">
              <TextLink href={`/extensions/${mod.slug}/`}>{mod.name}</TextLink>
            </li>
          ))}
        </ul>
        <Prose>
          <p>
            <TextLink href="/browse/?kind=mod">Browse the mods</TextLink> to see what each one does and where its
            source is.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="kinds" title="The other kinds of extension">
        <DefinitionList
          items={(Object.keys(OTHER_KIND_NOTES) as OtherKind[]).map((kind) => ({
            id: kind,
            term: OTHER_KIND_NOTES[kind].term,
            description: <p>{OTHER_KIND_NOTES[kind].description}</p>,
          }))}
        />
      </DocSection>

      <DocSection id="data" title="Where the data comes from">
        <Prose>
          <p>
            Maintainers keep entries in <InlineCode>src/data/catalog.json</InlineCode>. Community entries are one file
            each in <InlineCode>src/data/community/</InlineCode>, added by pull request; see{" "}
            <TextLink href="/publish/">Publish</TextLink>. Every entry is validated against a schema when the site
            builds.
          </p>
          <p>
            The catalog was generated on <time dateTime={generatedAt}>{generatedAt}</time> and holds {extensions.length}{" "}
            entries. Descriptions, publishers, licenses and install commands were written from the source pages linked
            on each entry. Star counts, where shown, carry the date they were captured. There are no download counts
            because no registry exists to measure them.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="source-verified" title="What Source verified means">
        <Callout tone="warning">
          <p>{VERIFICATION_NOTE}</p>
        </Callout>
        <Prose>
          <p>
            Source verified means the entry&apos;s source URL returned HTTP 200 on the date shown on the entry. It says
            the source exists and is public. It says nothing about what the code does, who maintains it, or whether it
            is safe.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="re-verify" title="Check it yourself">
        <Prose>
          <p>
            Two scripts in the repository re-run the checks. The first requests every URL in the catalog and exits with
            an error if any of them does not respond with HTTP 200. The second confirms that plugin and mod entries have
            the manifest files they should, such as <InlineCode>.claude-plugin/plugin.json</InlineCode>.
          </p>
        </Prose>
        <div className="flex max-w-[65ch] flex-col gap-2">
          <CopyCommand command="npm run catalog:verify" />
          <CopyCommand command="npm run catalog:structure" />
        </div>
        <Prose>
          <p>
            Passing runs repeat the claims already on the page. To decide whether something is safe to install, follow{" "}
            <TextLink href="/security/#before-you-install">the checks on the Security page</TextLink>.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="ideas" title="Ideas are not entries">
        <Prose>
          <p>
            The marketplace spec also describes {ideaCount} mods that nobody has published. They are kept on the{" "}
            <TextLink href="/ideas/">Ideas page</TextLink>, apart from the directory, its counts and its search, and
            they cannot be installed.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="analytics" title="Analytics">
        <Prose>
          <p>
            This site uses Vercel Web Analytics to count page views. Vercel states that it works without third-party
            cookies, identifies a visitor by a hash created from the incoming request, and discards that session after
            24 hours. The site sets no cookies of its own; your light or dark theme choice is kept in your browser&apos;s local storage.
          </p>
          <p>
            Read Vercel&apos;s{" "}
            <TextLink href="https://vercel.com/docs/analytics/privacy-policy">privacy and compliance notes</TextLink>{" "}
            for what is collected.
          </p>
        </Prose>
      </DocSection>
    </DocPage>
  );
}
