import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Extension } from "@/lib/types";
import { FeaturedRow } from "./FeaturedRow";
import { selectBuiltInMods } from "./home-data";

export interface FeaturedSectionProps {
  /** Already ordered and capped by `pickFeatured`. Every entry gets one row, so any count fills the layout. */
  readonly extensions: readonly Extension[];
  /** False when the entries are only the most starred (nothing is featured). Defaults to true. */
  readonly isEditorialPick?: boolean;
}

const ROW_REVEAL_STEP_SECONDS = 0.06;

function headingFor(isEditorialPick: boolean, isBuiltInModSet: boolean): string {
  if (!isEditorialPick) return "Most starred";
  return isBuiltInModSet ? "Mods that ship inside Claude Code" : "Featured entries";
}

function bodyFor(isEditorialPick: boolean, isBuiltInModSet: boolean): string {
  if (!isEditorialPick) {
    return "Nothing is featured right now, so these are the entries with the most GitHub stars. Star counts carry the date they were captured.";
  }
  return isBuiltInModSet
    ? "Each page explains what the mod does, how to set it up, and where its source lives. Featured is an editorial choice, not a security review."
    : "Hand-picked from the catalog. Featured is an editorial choice, not a security review.";
}

/**
 * A ledger: one full-width row per entry, separated by hairlines. Rows are added or removed with
 * the data, so 3, 4 or 5 entries never leave an empty cell. The heading follows the data: when
 * every entry is a mod that Anthropic ships built in it says so. When nothing is featured and the
 * entries are only the most starred, it says that instead of claiming a hand-picked choice.
 */
export function FeaturedSection({ extensions, isEditorialPick = true }: FeaturedSectionProps): ReactNode {
  if (extensions.length === 0) return null;
  const isBuiltInModSet =
    isEditorialPick && selectBuiltInMods(extensions).length === extensions.length;

  return (
    <section aria-label="Featured entries" className="border-t border-border">
      <Container className="flex flex-col gap-10 py-16 md:py-20">
        <SectionHeading title={headingFor(isEditorialPick, isBuiltInModSet)} body={bodyFor(isEditorialPick, isBuiltInModSet)} />
        <ul className="divide-y divide-border border-y border-border">
          {extensions.map((extension, index) => (
            <li key={extension.slug}>
              <Reveal delay={index * ROW_REVEAL_STEP_SECONDS}>
                <FeaturedRow extension={extension} isStarRanked={!isEditorialPick} />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
