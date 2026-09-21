import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type HeadingLevel = "h1" | "h2" | "h3";

export interface SectionHeadingProps {
  readonly title: string;
  readonly body?: string;
  readonly as?: HeadingLevel;
  readonly align?: "start";
  /** Use sparingly: at most one eyebrow per three sections on a page. */
  readonly eyebrow?: string;
  readonly className?: string;
}

const TITLE_CLASSES: Readonly<Record<HeadingLevel, string>> = {
  h1: "text-4xl leading-[1.05] md:text-5xl",
  h2: "text-3xl leading-[1.1] md:text-4xl",
  h3: "text-xl leading-[1.2] md:text-2xl",
};

/** Vertical stack of optional eyebrow, title and body. Body is capped at 65ch for readability. */
export function SectionHeading({
  title,
  body,
  as: Heading = "h2",
  eyebrow,
  className,
}: SectionHeadingProps): ReactNode {
  return (
    <div className={cn("flex flex-col items-start gap-3 text-left", className)}>
      {eyebrow ? (
        <p className="font-mono text-xs uppercase tracking-wider text-accent-text">{eyebrow}</p>
      ) : null}
      <Heading className={cn("font-semibold tracking-tight text-fg text-balance", TITLE_CLASSES[Heading])}>
        {title}
      </Heading>
      {body ? <p className="max-w-[65ch] text-base leading-relaxed text-fg-muted md:text-lg">{body}</p> : null}
    </div>
  );
}
