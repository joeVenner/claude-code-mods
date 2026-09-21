import { CaretRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExtensionCard } from "@/components/catalog/ExtensionCard";
import { KindIcon } from "@/components/catalog/KindIcon";
import { StarCount } from "@/components/catalog/StarCount";
import { AvailabilityChip } from "@/components/catalog/AvailabilityChip";
import { COMMUNITY_LISTING_NOTE, CommunityBadge } from "@/components/catalog/CommunityBadge";
import { StatusBadge } from "@/components/catalog/StatusBadge";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { CATEGORY_LABELS, KIND_LABELS } from "@/lib/types";
import type { Extension } from "@/lib/types";
import { DetailCallout } from "./DetailCallout";
import { DetailsList } from "./DetailsList";
import { ExtensionLinks, collectExtensionLinks } from "./ExtensionLinks";
import { buildGuideAnchors } from "./guide";
import { GuideSections } from "./GuideSections";
import { GuideTocSidebar } from "./GuideToc";
import { GuideTocCollapsible } from "./GuideTocCollapsible";
import { InlineLink } from "./InlineLink";
import { InstallSection } from "./InstallSection";
import { VerificationExplainer, VerificationNote } from "./VerificationNote";

export interface ExtensionDetailProps {
  readonly extension: Extension;
  /** Pre-resolved by the page from the catalog so this component stays pure and easy to test. */
  readonly related: readonly Extension[];
}

/** Caveat stored on the entry (for example early access), shown before anything else the reader might act on. */
function NoticeCallout({ notice }: { readonly notice: string }): ReactNode {
  return (
    <DetailCallout tone="warning" label="Notice">
      <p>{notice}</p>
    </DetailCallout>
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
  const { publisher, license, stars } = extension;

  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      <MetaItem label="Publisher">
        {publisher.url !== null ? <InlineLink href={publisher.url}>{publisher.name}</InlineLink> : publisher.name}
        {publisher.kind === "community" ? (
          <span className="mt-1 block max-w-[65ch] text-fg-muted">{COMMUNITY_LISTING_NOTE}</span>
        ) : null}
      </MetaItem>
      {license !== null ? (
        // Shown exactly as stored: the license text is the source's wording, not ours to summarize.
        <MetaItem label="License">
          <span className="block max-w-[65ch]">{license}</span>
        </MetaItem>
      ) : null}
      {stars !== null ? (
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
  const heading = extension.kind === "mod" ? "Hooks it registers" : "Lifecycle hooks";
  return (
    <section aria-labelledby="hooks-heading" className="flex flex-col gap-3">
      <h2 id="hooks-heading" className="text-base font-semibold text-fg">
        {heading}
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {extension.hooks.map((hook) => (
          <li key={hook}>
            <Chip className="font-mono">{hook}</Chip>
          </li>
        ))}
      </ul>
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
 * Detail view for one catalog entry. With a guide, the guide is the primary content: a sticky
 * table of contents (xl), the guide in the main column and facts in the rail. Without one, the
 * simpler two-column layout applies. Below lg everything is one column: notice, contents, guide,
 * then the rail. Every fact shown comes from `extension`.
 */
export function ExtensionDetail({ extension, related }: ExtensionDetailProps): ReactNode {
  const { name, kind, summary, description, categories, tags, verification, availability, notice, details, guide } =
    extension;
  const links = collectExtensionLinks(extension);
  const hasGuide = guide.length > 0;
  const guideAnchors = buildGuideAnchors(guide);

  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb name={name} />

      <div
        className={cn(
          "grid gap-12",
          hasGuide
            ? "lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12 xl:grid-cols-[11rem_minmax(0,1fr)_20rem] xl:gap-10"
            : "lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16",
        )}
      >
        {hasGuide ? <GuideTocSidebar anchors={guideAnchors} /> : null}

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
              <CommunityBadge publisher={extension.publisher} />
              <AvailabilityChip availability={availability} />
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

          {notice !== null ? <NoticeCallout notice={notice} /> : null}

          {hasGuide ? (
            <>
              <GuideTocCollapsible anchors={guideAnchors} />
              <GuideSections guide={guide} anchors={guideAnchors} />
              <HookList extension={extension} />
            </>
          ) : (
            <div className="flex max-w-[65ch] flex-col gap-4 text-base leading-relaxed text-fg-muted">
              {description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}

          <VerificationExplainer verification={verification} />
        </article>

        <aside aria-label="Install, links and details" className="flex min-w-0 flex-col gap-8">
          <InstallSection extension={extension} />
          <DetailsList details={details} />
          {hasGuide ? null : <HookList extension={extension} />}
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
