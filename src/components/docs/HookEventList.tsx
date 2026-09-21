import type { ReactNode } from "react";
import { CommunityBadge } from "@/components/catalog/CommunityBadge";
import { DefinitionList } from "@/components/docs/DefinitionList";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import { extensionPath } from "@/lib/seo/metadata";
import { KIND_LABELS, type ExtensionKind, type Publisher } from "@/lib/types";

export interface HookEntryRef {
  readonly slug: string;
  readonly name: string;
  readonly kind: ExtensionKind;
  readonly publisherKind: Publisher["kind"];
}

export interface HookEventRow {
  /** The hook name exactly as the entry's own source writes it. */
  readonly event: string;
  /** Entries that list it, in the order to show them. */
  readonly entries: readonly HookEntryRef[];
}

export interface HookEventListProps {
  readonly rows: readonly HookEventRow[];
  /** Shown instead of the list when no entry lists an event in this group. */
  readonly emptyMessage: string;
}

/** One row per hook event, each listing the entries that use it. Event names are rendered as text only. */
export function HookEventList({ rows, emptyMessage }: HookEventListProps): ReactNode {
  if (rows.length === 0) return <p className="max-w-[65ch] text-base leading-relaxed text-fg-muted">{emptyMessage}</p>;
  return (
    <DefinitionList
      items={rows.map((row) => ({
        id: row.event,
        term: <InlineCode>{row.event}</InlineCode>,
        description: (
          <ul className="flex flex-col gap-1.5">
            {row.entries.map((entry) => (
              <li key={entry.slug} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <TextLink href={extensionPath(entry.slug)}>{entry.name}</TextLink>
                <span className="text-sm">{KIND_LABELS[entry.kind]}</span>
                <CommunityBadge publisher={{ kind: entry.publisherKind }} />
              </li>
            ))}
          </ul>
        ),
      }))}
    />
  );
}
