import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { BrowseExplorer } from "@/components/browse/BrowseExplorer";
import { BrowseSkeleton } from "@/components/browse/BrowseSkeleton";
import { toListItems } from "@/components/catalog/ExtensionListItem";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getAllExtensions } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Browse extensions",
  description:
    "Search Claude Code mods, plugins, skills, agents, hooks, and MCP servers. Filter by kind, category, and availability.",
  alternates: { canonical: "/browse/" },
};

export default function BrowsePage(): ReactNode {
  // Only the fields the list needs cross into the client bundle, not every entry's guide text.
  const extensions = toListItems(getAllExtensions());

  return (
    <Container as="section" className="py-10 md:py-14">
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
