import type { ReactNode } from "react";

export interface EmptyStateProps {
  readonly title: string;
  readonly body: string;
  /** Usually a Button that resets filters or points at the next useful page. */
  readonly action?: ReactNode;
}

/** Composed zero-results panel. Dashed border marks "nothing here yet" without a decorative illustration. */
export function EmptyState({ title, body, action }: EmptyStateProps): ReactNode {
  return (
    <div className="flex flex-col items-start gap-3 rounded-panel border border-dashed border-border-strong px-5 py-8 md:px-8">
      <p className="text-lg font-semibold tracking-tight text-fg">{title}</p>
      <p className="max-w-[65ch] text-sm leading-relaxed text-fg-muted">{body}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
