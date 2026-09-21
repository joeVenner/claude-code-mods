import { ArrowRight } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { ExtensionListItem } from "@/components/catalog/ExtensionListItem";
import { HeroEntry } from "./HeroEntry";
import { HeroSearch } from "./HeroSearch";

export interface HeroProps {
  readonly extensions: readonly ExtensionListItem[];
}

/**
 * Asymmetric split: short copy on the left, the working search on the right. The headline stays at
 * one size on lg and up because a larger one would wrap to three lines in the copy column. On lg the section
 * slides under the 64px sticky header (`-mt-16`) so that `min-h-[100dvh]` is the whole first
 * screen and the 96px top padding still clears the header by 32px.
 */
export function Hero({ extensions }: HeroProps): ReactNode {
  return (
    <section
      aria-labelledby="hero-heading"
      className="lg:-mt-16 lg:flex lg:min-h-[100dvh] lg:items-center lg:pb-10 lg:pt-24"
    >
      <Container className="grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:items-center lg:gap-12 lg:py-0">
        <div className="flex flex-col items-start gap-6">
          <HeroEntry order={0}>
            <h1
              id="hero-heading"
              className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-fg lg:text-[2.5rem]"
            >
              Mods and extensions for Claude Code
            </h1>
          </HeroEntry>
          <HeroEntry order={1}>
            <p className="max-w-[46ch] text-base leading-relaxed text-fg-muted md:text-lg">
              A community directory of Claude Code mods, plugins, skills, agents, hooks and MCP servers. Every
              listing links to its source.
            </p>
          </HeroEntry>
          <HeroEntry order={2} className="flex flex-wrap items-center gap-3">
            <Button
              href="/browse/"
              size="lg"
              iconRight={<ArrowRight size={18} weight="regular" aria-hidden="true" />}
            >
              Browse the directory
            </Button>
            <Button href="/security/" variant="ghost" size="lg">
              Read the security model
            </Button>
          </HeroEntry>
        </div>
        <HeroEntry order={3}>
          <HeroSearch extensions={extensions} />
        </HeroEntry>
      </Container>
    </section>
  );
}
