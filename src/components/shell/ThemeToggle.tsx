"use client";

import { Moon, Sun } from "@phosphor-icons/react/ssr";
import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { THEME_STORAGE_KEY } from "./theme";
import type { ThemePreference } from "./theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function readSystemTheme(): ThemePreference {
  if (typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** Resolved theme: an explicit data-theme wins, otherwise the system preference. */
function readResolvedTheme(): ThemePreference {
  const explicitTheme = document.documentElement.getAttribute("data-theme");
  if (explicitTheme === "light" || explicitTheme === "dark") return explicitTheme;
  return readSystemTheme();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const mediaQuery = typeof window.matchMedia === "function" ? window.matchMedia(DARK_QUERY) : null;
  mediaQuery?.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    mediaQuery?.removeEventListener("change", onChange);
  };
}

// The server cannot know the theme, so the first render is neutral and icons are picked by CSS.
function getServerSnapshot(): ThemePreference | null {
  return null;
}

function persistTheme(theme: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Storage can be blocked (private mode, site data disabled). The choice still applies to this page.
    console.warn("Theme preference could not be saved", error);
  }
}

export interface ThemeToggleProps {
  readonly className?: string;
}

/**
 * Switches between light and dark by setting `data-theme` on `<html>` and saving the choice.
 * Both icons are always rendered and swapped with the `dark:` variant, which shares the token
 * rules, so there is no flash and no hydration mismatch.
 */
export function ThemeToggle({ className }: ThemeToggleProps): ReactNode {
  const resolvedTheme = useSyncExternalStore(subscribe, readResolvedTheme, getServerSnapshot);

  function handleToggle(): void {
    const nextTheme: ThemePreference = readResolvedTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    persistTheme(nextTheme);
    notifyListeners();
  }

  const label =
    resolvedTheme === null ? "Toggle color theme" : `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme`;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-[transform,background-color,color] duration-150 hover:bg-surface-2 hover:text-fg active:scale-[0.98] lg:size-10",
        className,
      )}
    >
      <Sun size={20} weight="regular" aria-hidden="true" className="hidden dark:block" />
      <Moon size={20} weight="regular" aria-hidden="true" className="block dark:hidden" />
    </button>
  );
}
