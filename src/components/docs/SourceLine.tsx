import type { ReactNode } from "react";
import { TextLink } from "@/components/docs/TextLink";
import type { LearnSource } from "@/components/docs/learnContent";

export interface SourceLineProps {
  readonly sources: readonly LearnSource[];
}

/** "Source: a, b": where a claim above it comes from. Renders nothing for an empty list, so a claim is never given a blank source. */
export function SourceLine({ sources }: SourceLineProps): ReactNode {
  if (sources.length === 0) return null;
  return (
    <p className="text-sm">
      Source:{" "}
      {sources.map((source, index) => (
        <span key={source.href}>
          {index === 0 ? "" : ", "}
          <TextLink href={source.href}>{source.label}</TextLink>
        </span>
      ))}
    </p>
  );
}
