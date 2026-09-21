"use client";

import { Check, Copy } from "@phosphor-icons/react/ssr";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CopyCommandProps {
  readonly command: string;
  /** Short caption above the command, for example "Add the marketplace". */
  readonly label?: string;
  /** Accessible name suffix for the copy button when the caption is shown elsewhere, so a stack of rows stays distinguishable. */
  readonly copyLabel?: string;
  readonly className?: string;
}

type CopyStatus = "idle" | "copied" | "failed";

const COPIED_RESET_MS = 2000;
const FAILED_RESET_MS = 6000;

const STATUS_MESSAGES: Readonly<Record<CopyStatus, string>> = {
  idle: "",
  copied: "Copied",
  failed: "Copy failed, select the text",
};

/**
 * Terminal-style command row with a copy button. Clipboard access can be missing (insecure
 * context) or rejected (permissions), so failure is a first-class visible state and the command
 * text is selected for a manual copy.
 */
export function CopyCommand({ command, label, copyLabel, className }: CopyCommandProps): ReactNode {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const commandRef = useRef<HTMLElement>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current);
    };
  }, []);

  function scheduleReset(delayMs: number): void {
    if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setStatus("idle"), delayMs);
  }

  function selectCommandText(): void {
    const commandElement = commandRef.current;
    if (!commandElement) return;
    window.getSelection()?.selectAllChildren(commandElement);
  }

  async function handleCopy(): Promise<void> {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(command);
      setStatus("copied");
      scheduleReset(COPIED_RESET_MS);
    } catch (error) {
      console.warn("Clipboard write failed", error);
      selectCommandText();
      setStatus("failed");
      scheduleReset(FAILED_RESET_MS);
    }
  }

  const buttonLabelSuffix = label ?? copyLabel;
  const isFailed = status === "failed";
  const isCopied = status === "copied";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? <p className="text-sm text-fg-muted">{label}</p> : null}
      <div className="flex items-stretch overflow-hidden rounded-control border border-control-border bg-surface">
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
          <span aria-hidden="true" className="select-none font-mono text-sm text-accent-text">
            $
          </span>
          {/* Wrap instead of scroll: a hidden tail on a command someone is about to run is a trap. tabIndex lets keyboard users focus and select it. */}
          <code
            ref={commandRef}
            tabIndex={0}
            className="min-w-0 flex-1 whitespace-pre-wrap font-mono text-sm text-fg [overflow-wrap:anywhere]"
          >
            {command}
          </code>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={buttonLabelSuffix ? `Copy command: ${buttonLabelSuffix}` : "Copy command"}
          className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-l border-border px-4 text-sm font-medium text-fg-muted transition-[transform,background-color,color] duration-150 hover:bg-surface-2 hover:text-fg active:scale-[0.98] md:min-h-10"
        >
          {isCopied ? <Check size={16} weight="regular" aria-hidden="true" /> : <Copy size={16} weight="regular" aria-hidden="true" />}
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={cn("min-h-5 text-sm", isFailed ? "text-danger" : "text-accent-text")}
      >
        {STATUS_MESSAGES[status]}
      </p>
    </div>
  );
}
