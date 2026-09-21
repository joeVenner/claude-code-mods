import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { KindIcon } from "@/components/catalog/KindIcon";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { KIND_LABELS } from "@/lib/types";
import type { ExtensionKind } from "@/lib/types";
import { KIND_DESCRIPTIONS } from "./kind-descriptions";

export interface KindExplorerProps {
  readonly counts: Readonly<Record<ExtensionKind, number>>;
  /** Derived from the catalog by `describeBuiltInMods`. Null or absent when no built-in mod exists. */
  readonly builtInModsNote?: string | null;
}

interface KindCellStyle {
  /** Grid placement. Below md every cell is a full-width row. */
  readonly placement: string;
  /** Border and fill; the fills differ per cell on purpose so the bento has visual rhythm. */
  readonly surface: string;
  /** Decorative texture layer built from tokens, or null for a plain cell. */
  readonly texture: string | null;
  readonly isLarge?: boolean;
}

/**
 * Bento layout on a 12-column grid at lg. Mod is the largest cell: six columns and two rows on
 * the left. Plugin takes the top right, skill and agent split the row under it, and MCP, hook
 * and command fill the last row 5/3/4. Spans per row add up to 12, so no cell is left empty.
 * From md to lg there are two columns and mod spans both, which leaves six cells in three rows.
 */
const KIND_CELL_STYLES: Readonly<Record<ExtensionKind, KindCellStyle>> = {
  mod: {
    placement: "md:col-span-2 lg:col-span-6 lg:row-span-2",
    surface: "border-accent/40 bg-accent-soft",
    texture:
      "bg-[linear-gradient(to_right,var(--accent)_1px,transparent_1px),linear-gradient(to_bottom,var(--accent)_1px,transparent_1px)] bg-[length:28px_28px] opacity-15 [mask-image:radial-gradient(ellipse_at_bottom_right,black,transparent_70%)]",
    isLarge: true,
  },
  plugin: {
    placement: "lg:col-span-6",
    surface: "border-border bg-surface",
    texture:
      "bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[length:28px_28px] [mask-image:radial-gradient(ellipse_at_bottom_right,black,transparent_70%)]",
  },
  skill: {
    placement: "lg:col-span-3",
    surface: "border-border bg-surface-2",
    texture: null,
  },
  agent: {
    placement: "lg:col-span-3",
    surface: "border-border bg-surface",
    texture: null,
  },
  "mcp-server": {
    placement: "lg:col-span-5",
    surface: "border-border bg-surface-2",
    texture:
      "bg-[radial-gradient(var(--border-strong)_1px,transparent_1px)] bg-[length:16px_16px] [mask-image:linear-gradient(to_left,black,transparent_60%)]",
  },
  hook: {
    placement: "lg:col-span-3",
    surface: "border-border bg-surface",
    texture: null,
  },
  command: {
    placement: "lg:col-span-4",
    surface: "border-border bg-surface",
    texture:
      "bg-[repeating-linear-gradient(to_bottom,var(--border)_0,var(--border)_1px,transparent_1px,transparent_8px)] [mask-image:linear-gradient(to_top,black,transparent_55%)]",
  },
};

/** Visual reading order, row by row, mod first. Must be a permutation of EXTENSION_KINDS (covered by a test). */
export const KIND_CELL_ORDER: readonly ExtensionKind[] = [
  "mod",
  "plugin",
  "skill",
  "agent",
  "mcp-server",
  "hook",
  "command",
];

const REVEAL_STEP_SECONDS = 0.05;

function formatCountLabel(count: number): string {
  return `${count} ${count === 1 ? "listing" : "listings"}`;
}

export function kindBrowseHref(kind: ExtensionKind): string {
  return `/browse/?kind=${encodeURIComponent(kind)}`;
}

/** One tile per extension kind. Counts come from the catalog, never from this file. */
export function KindExplorer({ counts, builtInModsNote = null }: KindExplorerProps): ReactNode {
  return (
    <section aria-label="Extension kinds" className="border-t border-border">
      <Container className="flex flex-col gap-10 py-16 md:py-20">
        <SectionHeading
          title="Browse by kind"
          body="Claude Code can be extended in several ways. Each tile opens the directory filtered to that kind."
        />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
          {KIND_CELL_ORDER.map((kind, index) => {
            const style = KIND_CELL_STYLES[kind];
            const isLarge = style.isLarge === true;
            return (
              <li key={kind} className={style.placement}>
                <Reveal delay={index * REVEAL_STEP_SECONDS} className="h-full">
                  <Link
                    href={kindBrowseHref(kind)}
                    className={cn(
                      "group relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-panel border p-5",
                      "transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-fg-muted active:translate-y-0 active:scale-[0.99] motion-reduce:hover:translate-y-0",
                      isLarge ? "min-h-56 lg:p-8" : "min-h-40",
                      style.surface,
                    )}
                  >
                    {style.texture ? (
                      <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0", style.texture)} />
                    ) : null}
                    <span className="relative flex items-start justify-between gap-4">
                      <span className="inline-flex size-9 items-center justify-center rounded-control border border-border-strong bg-bg text-accent-text">
                        <KindIcon kind={kind} size={20} />
                      </span>
                      <span className="font-mono text-sm text-fg-muted">{formatCountLabel(counts[kind])}</span>
                    </span>
                    <span className="relative flex flex-col gap-2">
                      <span
                        className={cn(
                          "flex items-center gap-2 font-semibold tracking-tight text-fg",
                          isLarge ? "text-3xl" : "text-lg",
                        )}
                      >
                        {KIND_LABELS[kind]}
                        <ArrowUpRight
                          size={18}
                          weight="regular"
                          aria-hidden="true"
                          className="text-fg-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                        />
                      </span>
                      <span
                        className={cn(
                          "max-w-[52ch] leading-relaxed",
                          isLarge ? "text-base text-fg" : "text-sm text-fg-muted",
                        )}
                      >
                        {KIND_DESCRIPTIONS[kind]}
                        {kind === "mod" && builtInModsNote !== null ? (
                          <span className="mt-2 block text-fg-muted">{builtInModsNote}</span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
