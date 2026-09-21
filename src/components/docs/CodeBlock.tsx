import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CodeBlockProps {
  /** The text shown, exactly as written. It is rendered as text and never interpreted as markup. */
  readonly code: string;
  /** File path shown above the block, for example `hooks/register.ts`. */
  readonly filename?: string;
  /** Accessible name for a block that has no file name, for example a folder tree. Not shown. */
  readonly label?: string;
  readonly className?: string;
}

/**
 * A multi-line block of code or file contents. Long lines scroll instead of wrapping, because
 * wrapping breaks indentation, so the block takes focus to let a keyboard user scroll it.
 */
export function CodeBlock({ code, filename, label, className }: CodeBlockProps): ReactNode {
  const accessibleName = filename === undefined ? (label ?? "Code") : `Contents of ${filename}`;
  return (
    <figure className={cn("flex min-w-0 max-w-3xl flex-col gap-2", className)}>
      {filename === undefined ? null : (
        <figcaption className="font-mono text-sm text-fg-muted [overflow-wrap:anywhere]">{filename}</figcaption>
      )}
      <pre
        tabIndex={0}
        // A bare <pre> has no role, so a name on it is ignored: group gives it one without adding a landmark.
        role="group"
        aria-label={accessibleName}
        className="overflow-x-auto rounded-control border border-control-border bg-surface p-4 font-mono text-sm leading-relaxed text-fg"
      >
        <code>{code}</code>
      </pre>
    </figure>
  );
}
