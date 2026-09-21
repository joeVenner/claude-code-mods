"use client";

import { List, X } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Z_CLASS, isNavLinkActive } from "@/lib/site";
import type { NavLink } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

export interface SiteHeaderNavProps {
  readonly links: readonly NavLink[];
}

const MOBILE_MENU_ID = "mobile-menu";

function navLinkClassName(isActive: boolean): string {
  return cn(
    "inline-flex min-h-11 items-center whitespace-nowrap rounded-control px-3 text-sm font-medium transition-colors duration-150 lg:min-h-10",
    isActive ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface hover:text-fg",
  );
}

/**
 * Right side of the header: desktop links, theme toggle, and the mobile disclosure menu.
 * The menu is a plain disclosure (not a modal), so focus is never trapped; Escape and
 * route changes close it. Open state is stored with the pathname it was opened on, which
 * closes it on navigation without an effect.
 */
export function SiteHeaderNav({ links }: SiteHeaderNavProps): ReactNode {
  const pathname = usePathname();
  const [openedOnPath, setOpenedOnPath] = useState<string | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const isOpen = openedOnPath !== null && openedOnPath === pathname;

  // Clear stale state after navigation so returning to the page (Back) does not reopen the menu.
  // Adjusting state during render is React's documented alternative to an effect for this.
  if (openedOnPath !== null && openedOnPath !== pathname) setOpenedOnPath(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      setOpenedOnPath(null);
      toggleButtonRef.current?.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function handleToggle(): void {
    setOpenedOnPath(isOpen ? null : pathname);
  }

  return (
    <div className="flex items-center gap-1">
      <nav aria-label="Primary" className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {links.map((link) => {
            const isActive = isNavLinkActive(pathname, link);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={navLinkClassName(isActive)}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <ThemeToggle />

      <button
        ref={toggleButtonRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={MOBILE_MENU_ID}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        className="inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-[transform,background-color,color] duration-150 hover:bg-surface-2 hover:text-fg active:scale-[0.98] lg:hidden"
      >
        {isOpen ? (
          <X size={22} weight="regular" aria-hidden="true" />
        ) : (
          <List size={22} weight="regular" aria-hidden="true" />
        )}
      </button>

      <nav
        id={MOBILE_MENU_ID}
        aria-label="Mobile"
        hidden={!isOpen}
        className={cn(
          "absolute inset-x-0 top-full border-b border-border bg-bg px-4 pb-4 pt-2 lg:hidden",
          Z_CLASS.menu,
        )}
      >
        <ul className="flex flex-col">
          {links.map((link) => {
            const isActive = isNavLinkActive(pathname, link);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setOpenedOnPath(null)}
                  className={cn(navLinkClassName(isActive), "w-full")}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
