import { Info, Warning } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DetailCalloutTone = "note" | "warning";

export interface DetailCalloutProps {
  readonly tone?: DetailCalloutTone;
  /** Visible label. Together with the icon it carries the tone, so colour is never the only signal. */
  readonly label?: string;
  readonly children: ReactNode;
  readonly className?: string;
}

const TONE_CLASSES: Readonly<Record<DetailCalloutTone, string>> = {
  note: "border border-border bg-surface",
  warning: "border-2 border-fg-muted bg-surface-2",
};

const DEFAULT_LABELS: Readonly<Record<DetailCalloutTone, string>> = {
  note: "Note",
  warning: "Notice",
};

/** Caveat block for the detail page. A warning uses a heavier border and the warning icon. */
export function DetailCallout({ tone = "note", label, children, className }: DetailCalloutProps): ReactNode {
  const ToneIcon = tone === "warning" ? Warning : Info;

  return (
    <div
      role="note"
      data-tone={tone}
      className={cn("flex max-w-[65ch] items-start gap-3 rounded-panel p-4 md:p-5", TONE_CLASSES[tone], className)}
    >
      <ToneIcon
        size={22}
        weight="regular"
        aria-hidden="true"
        className={cn("mt-0.5 shrink-0", tone === "warning" ? "text-fg" : "text-accent-text")}
      />
      <div className="flex min-w-0 flex-col gap-1.5 text-sm leading-relaxed text-fg [overflow-wrap:anywhere] md:text-base md:leading-relaxed">
        <p className="font-semibold">{label ?? DEFAULT_LABELS[tone]}</p>
        {children}
      </div>
    </div>
  );
}
