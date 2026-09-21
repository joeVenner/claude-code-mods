import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { BrowseExplorer } from "@/components/browse/BrowseExplorer";
import { BrowseSkeleton } from "@/components/browse/BrowseSkeleton";
import { toListItems } from "@/components/catalog/ExtensionListItem";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllExtensions } from "@/lib/catalog";
import { buildBrowseGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

// The canonical is always /browse/: a static export cannot vary by query string.
export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.browse);

export default function BrowsePage(): ReactNode {
  // Only the fields the list needs cross into the client bundle, not every entry's guide text.
  const allExtensions = getAllExtensions();
  const extensions = toListItems(allExtensions);

  return (
    <Container as="section" className="py-10 md:py-14">
      <JsonLd data={buildBrowseGraph(allExtensions)} />
      <SectionHeading
        as="h1"
        title="Browse extensions"
        body="Search the directory, then narrow by kind, category, or how you get it."
      />
      <div className="mt-8 md:mt-10">
        {/* useSearchParams needs a Suspense boundary so the static export can prerender the shell. */}
        <Suspense fallback={<BrowseSkeleton />}>
          <BrowseExplorer extensions={extensions} />
        </Suspense>
      </div>
    </Container>
  );
}
