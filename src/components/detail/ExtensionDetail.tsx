import { CaretRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExtensionCard } from "@/components/catalog/ExtensionCard";
import { KindIcon } from "@/components/catalog/KindIcon";
import { StarCount } from "@/components/catalog/StarCount";
import { StatusBadge } from "@/components/catalog/StatusBadge";
import { Callout } from "@/components/docs/Callout";
import { TextLink } from "@/components/docs/TextLink";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CATEGORY_LABELS, KIND_LABELS } from "@/lib/types";
import type { Extension } from "@/lib/types";
import { ExtensionLinks, collectExtensionLinks } from "./ExtensionLinks";
import { InstallSection } from "./InstallSection";
import { VerificationExplainer, VerificationNote } from "./VerificationNote";

export interface ExtensionDetailProps {
  readonly extension: Extension;
  /** Pre-resolved by the page from the catalog so this component stays pure and easy to test. */
  readonly related: readonly Extension[];
}

const MOD_RUNTIME_CAVEAT =
  "The mod runtime this concept assumes is unconfirmed as a Claude Code feature.";

function ConceptNotice({ extension }: { readonly extension: Extension }): ReactNode {
  return (
    <Callout tone="warning" className="mb-8">
      <p>
        This is a concept, not a shipping extension. It is a proposed design from the marketplace spec, and no public
        repository was found for it.
      </p>
      {extension.kind === "mod" ? <p className="text-fg-muted">{MOD_RUNTIME_CAVEAT}</p> : null}
    </Callout>
  );
}

function Breadcrumb({ name }: { readonly name: string }): ReactNode {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-fg-muted">
        <li>
          <Link
            href="/browse/"
            className="inline-flex min-h-11 items-center rounded-control pr-1 hover:text-fg md:min-h-9"
          >
            Browse
          </Link>
        </li>
        <li aria-hidden="true" className="flex items-center">
          <CaretRight size={14} weight="regular" />
        </li>
        <li aria-current="page" className="text-fg">
          {name}
        </li>
      </ol>
    </nav>
  );
}

function MetaItem({ label, children }: { readonly label: string; readonly children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="text-sm text-fg">{children}</dd>
    </div>
  );
}

function ExtensionMeta({ extension }: { readonly extension: Extension }): ReactNode {
  const { publisher, license, stars, verification } = extension;
  // Stars are a verified-source fact; a concept has no repository to count them on.
  const shouldShowStars = stars !== null && verification.status === "verified";

  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      <MetaItem label="Publisher">
        {publisher.url !== null ? <TextLink href={publisher.url}>{publisher.name}</TextLink> : publisher.name}
      </MetaItem>
      {license !== null ? (
        <MetaItem label="License">
          <span className="font-mono">{license}</span>
        </MetaItem>
      ) : null}
      {shouldShowStars ? (
        <MetaItem label="GitHub stars">
          <StarCount stars={stars} className="font-mono" />
          <span className="text-fg-muted"> as of {stars.capturedAt}</span>
        </MetaItem>
      ) : null}
    </dl>
  );
}

function HookList({ extension }: { readonly extension: Extension }): ReactNode {
  if (extension.hooks.length === 0) return null;
  const isConcept = extension.verification.status === "concept";
  return (
    <section aria-labelledby="hooks-heading" className="flex flex-col gap-3">
      <h2 id="hooks-heading" className="text-base font-semibold text-fg">
        Lifecycle hooks
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {extension.hooks.map((hook) => (
          <li key={hook}>
            <Chip className="font-mono">{hook}</Chip>
          </li>
        ))}
      </ul>
      {isConcept ? (
        <p className="text-sm leading-relaxed text-fg-muted">
          Event names come from the marketplace spec and are not confirmed Claude Code hook names.
        </p>
      ) : null}
    </section>
  );
}

function TagList({ tags }: { readonly tags: readonly string[] }): ReactNode {
  if (tags.length === 0) return null;
  return (
    <section aria-labelledby="tags-heading" className="flex flex-col gap-3">
      <h2 id="tags-heading" className="text-base font-semibold text-fg">
        Tags
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <li key={tag}>
            <Chip>{tag}</Chip>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Detail view for one catalog entry. Two columns from lg (content, then rail); a single column
 * below, where the rail follows the description. Every fact shown comes from `extension`.
 */
export function ExtensionDetail({ extension, related }: ExtensionDetailProps): ReactNode {
  const { name, kind, summary, description, categories, tags, verification } = extension;
  const links = collectExtensionLinks(extension);

  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb name={name} />
      {verification.status === "concept" ? <ConceptNotice extension={extension} /> : null}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <article className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-4">
            <p className="flex items-center gap-2 font-mono text-sm text-fg-muted">
              <KindIcon kind={kind} size={18} />
              {KIND_LABELS[kind]}
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-fg text-balance md:text-5xl">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge verification={verification} />
              <ul className="flex flex-wrap gap-1.5" aria-label="Categories">
                {categories.map((category) => (
                  <li key={category}>
                    <Chip>{CATEGORY_LABELS[category]}</Chip>
                  </li>
                ))}
              </ul>
            </div>
            <ExtensionMeta extension={extension} />
          </header>

          <p className="max-w-[65ch] text-lg leading-relaxed text-fg">{summary}</p>

          <div className="flex max-w-[65ch] flex-col gap-4 text-base leading-relaxed text-fg-muted">
            {description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <VerificationExplainer verification={verification} />
        </article>

        <aside aria-label="Install, links and details" className="flex min-w-0 flex-col gap-8">
          <InstallSection extension={extension} />
          <HookList extension={extension} />
          <TagList tags={tags} />
          <ExtensionLinks links={links} />
          <div className="border-t border-border pt-5">
            <VerificationNote verification={verification} />
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-16 flex flex-col gap-6 border-t border-border pt-10">
          <h2 id="related-heading" className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">
            Related extensions
          </h2>
          <Reveal>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <ExtensionCard extension={item} />
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      ) : null}
    </Container>
  );
}
