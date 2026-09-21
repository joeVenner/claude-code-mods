import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { DISCLAIMER, NAV_LINKS, VERIFICATION_NOTE } from "@/lib/site";

export interface SiteFooterProps {
  /** Catalog generation date (YYYY-MM-DD), passed in by the layout when the data layer exists. */
  readonly catalogDate?: string;
}

export function SiteFooter({ catalogDate }: SiteFooterProps): ReactNode {
  return (
    <footer className="mt-24 border-t border-border">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-[65ch] flex-col gap-2 text-sm text-fg-muted">
          <p className="text-fg">{DISCLAIMER}</p>
          <p>{VERIFICATION_NOTE}</p>
          {catalogDate ? (
            <p>
              Catalog data generated on <time dateTime={catalogDate}>{catalogDate}</time>.
            </p>
          ) : null}
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-2 gap-y-1 md:flex-col md:items-end">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-control px-2 text-sm text-fg-muted transition-colors duration-150 hover:text-fg md:min-h-9"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
