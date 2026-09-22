"use client";

import { CaretDown } from "@phosphor-icons/react/ssr";
import { useState } from "react";
import type { ReactNode } from "react";
import { CommunityBadge } from "@/components/catalog/CommunityBadge";
import { InlineCode } from "@/components/docs/InlineCode";
import { TextLink } from "@/components/docs/TextLink";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchField } from "@/components/ui/SearchField";
import {
  filterEventRows,
  groupEventRows,
  type EventFamilyGroup,
  type EventReferenceRow,
  type EventUser,
} from "@/lib/event-reference";
import { extensionPath } from "@/lib/seo/metadata";
import { EVENT_FAMILIES, EVENT_FAMILY_LABELS, KIND_LABELS, type EventFamily } from "@/lib/types";

export interface EventReferenceExplorerProps {
  readonly rows: readonly EventReferenceRow[];
}

type FamilyChoice = EventFamily | "all";

const SELECT_CLASSES =
  "min-h-11 w-full rounded-control border border-control-border bg-surface px-3 text-base text-fg focus-visible:border-accent md:min-h-10 md:text-sm";

function isFamilyChoice(value: string): value is FamilyChoice {
  return value === "all" || (EVENT_FAMILIES as readonly string[]).includes(value);
}

function UserItem({ user, eventName }: { readonly user: EventUser; readonly eventName: string }): ReactNode {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <TextLink href={extensionPath(user.slug)}>{user.name}</TextLink>
      <span className="text-sm">{KIND_LABELS[user.kind]}</span>
      <CommunityBadge publisher={{ kind: user.publisherKind }} />
      {user.via === eventName ? null : (
        <span className="text-sm">
          lists it as <InlineCode>{user.via}</InlineCode>
        </span>
      )}
    </li>
  );
}

function EventRow({ row }: { readonly row: EventReferenceRow }): ReactNode {
  return (
    // globals.css already offsets every [id] below the sticky header; target: marks the row a link points at.
    // A row inside a closed <details> still has this id: the browser opens the details and scrolls to it
    // natively, for a full page load or a same-document hash change alike, with no script of our own.
    <div id={row.anchorId} className="grid gap-1.5 py-4 first:pt-0 target:bg-surface-2 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
      <dt className="text-base font-medium text-fg">
        <InlineCode>{row.name}</InlineCode>
      </dt>
      <dd className="flex max-w-[65ch] flex-col gap-2 text-base leading-relaxed text-fg-muted">
        <p className="text-sm">
          Declared at <TextLink href={row.sourceUrl}>line {row.line}</TextLink> of Anthropic&apos;s type declarations.
        </p>
        {row.users.length === 0 ? (
          <p className="text-sm">No entry in this directory lists it.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {row.users.map((user) => (
              <UserItem key={user.slug} user={user} eventName={row.name} />
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}

function NounGroups({ group }: { readonly group: EventFamilyGroup }): ReactNode {
  return (
    <>
      {group.nouns.map((noun) => (
        <div key={noun.noun} className="flex flex-col gap-3">
          <h4 className="font-mono text-sm font-semibold text-fg">{noun.noun}</h4>
          <dl className="divide-y divide-border">
            {noun.rows.map((row) => (
              <EventRow key={row.name} row={row} />
            ))}
          </dl>
        </div>
      ))}
    </>
  );
}

/**
 * One family, collapsed by default: a `<summary>` naming it and its count, opening natively on
 * click with no script of ours, and opening automatically if the page is asked to scroll to an
 * event inside it (a browser feature, not something this component arranges).
 */
function FamilyDisclosure({ group }: { readonly group: EventFamilyGroup }): ReactNode {
  return (
    <details className="group border-b border-border pb-6 first:pt-0 [&:not(:first-child)]:pt-6">
      {/* <summary>'s content model is phrasing content optionally intermixed with heading content
          (WHATWG), and svg counts as phrasing content, so the h3 next to the caret icon is valid.
          The family keeps its real h3 in the outline (no level skip to the noun h4s below) whether
          or not it is open. */}
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-control py-1 outline-none [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        <h3 className="text-xl font-semibold tracking-tight text-fg">
          {EVENT_FAMILY_LABELS[group.family]} <span className="text-base font-normal text-fg-muted">({group.count})</span>
        </h3>
        <CaretDown size={18} weight="bold" aria-hidden="true" className="shrink-0 text-fg-muted transition-transform duration-150 group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-6 pt-6">
        <NounGroups group={group} />
      </div>
    </details>
  );
}

/**
 * Every event, grouped by family and noun, with a filter. All rows are rendered on the server, so
 * the page reads in full without JavaScript and a link to one row always finds it: browsing shows
 * each family collapsed behind a native `<summary>`, which needs no script to open; typing a query
 * or picking a family switches to a flat, always-open list of just the matches, because someone
 * searching wants results immediately, not another click to open the group they are already in.
 */
export function EventReferenceExplorer({ rows }: EventReferenceExplorerProps): ReactNode {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<FamilyChoice>("all");
  const isBrowsing = query.trim() === "" && family === "all";
  const visibleRows = filterEventRows(rows, { query, family });
  const groups = groupEventRows(visibleRows);

  function clearFilters(): void {
    setQuery("");
    setFamily("all");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]">
        <SearchField
          id="event-filter"
          label="Filter events"
          value={query}
          onChange={setQuery}
          hint="Matches part of an event name, or the name of an entry that lists it."
          placeholder="tool.call, fs, diff"
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="event-family" className="text-sm font-medium text-fg">
            Family
          </label>
          <select
            id="event-family"
            value={family}
            onChange={(event) => {
              if (isFamilyChoice(event.target.value)) setFamily(event.target.value);
            }}
            className={SELECT_CLASSES}
          >
            <option value="all">All families</option>
            {EVENT_FAMILIES.map((choice) => (
              <option key={choice} value={choice}>
                {EVENT_FAMILY_LABELS[choice]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isBrowsing && groups.length > 0 ? (
        <p className="text-sm text-fg-muted">{rows.length} events in {groups.length} families. Open one, or filter to see matches right away.</p>
      ) : !isBrowsing ? (
        <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-fg-muted">
          {`Showing ${visibleRows.length} of ${rows.length} events`}
        </p>
      ) : null}
      {groups.length === 0 ? (
        <EmptyState
          title="No event matches"
          body="Nothing has that in its name or in the name of an entry that lists it. Try fewer letters, or clear the filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : isBrowsing ? (
        <div className="flex flex-col">
          {groups.map((group) => (
            <FamilyDisclosure key={group.family} group={group} />
          ))}
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.family} aria-labelledby={`family-${group.family}`} className="flex flex-col gap-6">
            <h3 id={`family-${group.family}`} className="text-xl font-semibold tracking-tight text-fg">
              {EVENT_FAMILY_LABELS[group.family]} <span className="text-base font-normal text-fg-muted">({group.count})</span>
            </h3>
            <NounGroups group={group} />
          </section>
        ))
      )}
    </div>
  );
}
