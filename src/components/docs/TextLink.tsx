import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { classifyHref } from "@/lib/url";

export interface TextLinkProps {
  readonly href: string;
  readonly children: ReactNode;
  readonly className?: string;
}

const LINK_CLASSES =
  "rounded-chip text-accent-text underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-fg";

/** Inline prose link. External https URLs open in a new tab with `noopener noreferrer`; unsafe hrefs throw. */
export function TextLink({ href, children, className }: TextLinkProps): ReactNode {
  const hrefKind = classifyHref(href);
  if (hrefKind === "unsafe") throw new Error(`Unsafe href rejected: ${JSON.stringify(href)}`);

  if (hrefKind === "external") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(LINK_CLASSES, className)}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cn(LINK_CLASSES, className)}>
      {children}
    </Link>
  );
}
