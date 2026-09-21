import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export interface DocSectionProps {
  readonly title: string;
  /** Anchor id, also used to name the section for assistive tech. */
  readonly id: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Titled `<section>` inside a doc page. Body copy is capped at 65ch by the children's own wrappers. */
export function DocSection({ title, id, children, className }: DocSectionProps): ReactNode {
  const headingId = `${id}-heading`;
  return (
    <Reveal>
      <section id={id} aria-labelledby={headingId} className={cn("flex flex-col gap-6", className)}>
        <h2 id={headingId} className="max-w-[40ch] text-2xl font-semibold leading-[1.15] tracking-tight text-fg text-balance md:text-3xl">
          {title}
        </h2>
        {children}
      </section>
    </Reveal>
  );
}

export interface ProseProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/** Vertical stack of paragraphs at a readable measure. */
export function Prose({ children, className }: ProseProps): ReactNode {
  return (
    <div className={cn("flex max-w-[65ch] flex-col gap-4 text-base leading-relaxed text-fg-muted", className)}>
      {children}
    </div>
  );
}
