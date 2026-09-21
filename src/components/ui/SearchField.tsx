"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react/ssr";
import { useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SearchFieldProps {
  readonly id: string;
  /** Visible label rendered above the input. Never replaced by the placeholder. */
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly hint?: string;
  readonly placeholder?: string;
  readonly className?: string;
}

/** Controlled search input with a real label, optional hint, and a clear button when non-empty. */
export function SearchField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  className,
}: SearchFieldProps): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = `${id}-hint`;
  const hasValue = value.length > 0;

  function handleClear(): void {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <div className="relative">
        <MagnifyingGlass
          size={18}
          weight="regular"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
        />
        <input
          ref={inputRef}
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
          autoComplete="off"
          spellCheck={false}
          className="min-h-11 w-full rounded-control border border-control-border bg-surface pl-10 pr-11 text-base text-fg placeholder:text-fg-muted focus-visible:border-accent md:min-h-10 md:text-sm [&::-webkit-search-cancel-button]:appearance-none"
        />
        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-0 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-control text-fg-muted transition-colors duration-150 hover:text-fg md:size-10"
          >
            <X size={16} weight="regular" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
