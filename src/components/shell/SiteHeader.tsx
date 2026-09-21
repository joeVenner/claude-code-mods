import { TerminalWindow } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { NAV_LINKS, SITE_NAME, Z_CLASS } from "@/lib/site";
import { cn } from "@/lib/cn";
import { SiteHeaderNav } from "./SiteHeaderNav";

/** 64px sticky header: wordmark left, navigation and theme toggle right, single line from lg up. */
export function SiteHeader(): ReactNode {
  return (
    <header className={cn("sticky top-0 border-b border-border bg-bg", Z_CLASS.header)}>
      <Container className="relative flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-control text-base font-semibold tracking-tight text-fg"
        >
          <TerminalWindow size={22} weight="regular" aria-hidden="true" className="text-accent-text" />
          {SITE_NAME}
        </Link>
        <SiteHeaderNav links={NAV_LINKS} />
      </Container>
    </header>
  );
}
