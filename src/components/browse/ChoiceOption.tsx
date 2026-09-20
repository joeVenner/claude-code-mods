import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChoiceOptionLayout = "chip" | "row";

export interface ChoiceOptionProps {
  /** Radio group name. One group per facet. */
  readonly name: string;
  readonly value: string;
  readonly label: string;
  /** Results this option would give with the other filters held fixed. */
  readonly count: number;
  readonly isChecked: boolean;
  /** True for the "All" option: it clears the facet, so it must stay selectable even at zero results. */
  readonly isAlwaysEnabled?: boolean;
  readonly layout: ChoiceOptionLayout;
  readonly onSelect: (value: string) => void;
}

const LAYOUT_CLASSES: Readonly<Record<ChoiceOptionLayout, string>> = {
  chip: "min-h-11 gap-2 rounded-chip px-3 md:min-h-8",
  row: "min-h-11 w-full justify-between gap-3 rounded-control px-3 md:min-h-8",
};

/**
 * One radio-style choice. A real visually hidden radio keeps arrow-key navigation and screen
 * reader semantics; the sibling span is the visible chip. An option that would return nothing is
 * disabled unless it is the current selection, so it can always be deselected.
 */
export function ChoiceOption({
  name,
  value,
  label,
  count,
  isChecked,
  isAlwaysEnabled = false,
  layout,
  onSelect,
}: ChoiceOptionProps): ReactNode {
  const isDisabled = count === 0 && !isChecked && !isAlwaysEnabled;

  return (
    <label className="flex">
      <input
        type="radio"
        name={name}
        value={value}
        checked={isChecked}
        disabled={isDisabled}
        onChange={() => onSelect(value)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "inline-flex cursor-pointer items-center border text-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.98]",
          "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
          "peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent-text",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-disabled:hover:border-border peer-disabled:hover:text-fg-muted peer-disabled:active:scale-100",
          LAYOUT_CLASSES[layout],
        )}
      >
        <span>{label}</span>
        {/* The space keeps the accessible name readable ("Plugin 8"); flex layout ignores it visually. */}{" "}
        <span className="font-mono text-xs tabular-nums">{count}</span>
      </span>
    </label>
  );
}
