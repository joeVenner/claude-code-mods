import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { Extension } from "@/lib/types";

export interface ExtensionLink {
  readonly label: string;
  readonly url: string;
}

/**
 * Repository first, then the entry's own links, then the verified source when it differs.
 * Deduplicated by URL so the same page is never offered twice. Concepts have no repository,
 * so only their explicit `links` (if any) appear.
 */
export function collectExtensionLinks(extension: Extension): readonly ExtensionLink[] {
  const candidates: ExtensionLink[] = [];
  if (extension.repositoryUrl !== null) {
    candidates.push({ label: "Source repository", url: extension.repositoryUrl });
  }
  candidates.push(...extension.links);
  if (extension.verification.status === "verified") {
    candidates.push({ label: "Verified source", url: extension.verification.sourceUrl });
  }

  const seenUrls = new Set<string>();
  return candidates.filter((link) => {
    if (seenUrls.has(link.url)) return false;
    seenUrls.add(link.url);
    return true;
  });
}

export interface ExtensionLinksProps {
  readonly links: readonly ExtensionLink[];
}

export function ExtensionLinks({ links }: ExtensionLinksProps): ReactNode {
  if (links.length === 0) return null;
  return (
    <section aria-labelledby="links-heading" className="flex flex-col gap-3">
      <h2 id="links-heading" className="text-base font-semibold text-fg">
        Links
      </h2>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.url}>
            <Button
              variant="secondary"
              href={link.url}
              className="w-full justify-between"
              iconRight={<ArrowSquareOut size={16} weight="regular" aria-hidden="true" />}
            >
              {link.label}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
