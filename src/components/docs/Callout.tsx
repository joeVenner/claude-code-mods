import { Info, Warning } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CalloutTone = "note" | "warning";

export interface CalloutProps {
  readonly tone?: CalloutTone;
  readonly children: ReactNode;
  readonly className?: string;
}

const TONE_LABELS: Readonly<Record<CalloutTone, string>> = {
  note: "Note",
  warning: "Warning",
};

// Tone is carried by the icon shape, the visible label and border weight, never by color alone.
const TONE_CLASSES: Readonly<Record<CalloutTone, string>> = {
  note: "border border-border bg-surface",
  warning: "border-2 border-fg-muted bg-surface-2",
};

const ICON_CLASSES: Readonly<Record<CalloutTone, string>> = {
  note: "text-accent-text",
  warning: "text-fg",
};

/** Inline notice for caveats readers must not skip. Body is passed as children (paragraphs). */
export function Callout({ tone = "note", children, className }: CalloutProps): ReactNode {
  const ToneIcon = tone === "warning" ? Warning : Info;

  return (
    <div
      role="note"
      data-tone={tone}
      className={cn("flex max-w-[65ch] items-start gap-3 rounded-panel p-4 md:p-5", TONE_CLASSES[tone], className)}
    >
      <ToneIcon size={22} weight="regular" aria-hidden="true" className={cn("mt-0.5 shrink-0", ICON_CLASSES[tone])} />
      <div className="flex min-w-0 flex-col gap-2 text-sm leading-relaxed text-fg md:text-base md:leading-relaxed">
        <p className="font-semibold">{TONE_LABELS[tone]}</p>
        {children}
      </div>
    </div>
  );
}
