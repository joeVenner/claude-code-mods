import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { BrowseExplorer } from "@/components/browse/BrowseExplorer";
import { BrowseSkeleton } from "@/components/browse/BrowseSkeleton";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getAllExtensions } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Browse extensions",
  description:
    "Search Claude Code plugins, skills, agents, hooks, MCP servers, and proposed mod concepts. Filter by kind, category, and whether the source was checked.",
  alternates: { canonical: "/browse/" },
};

export default function BrowsePage(): ReactNode {
  const extensions = getAllExtensions();

  return (
    <Container as="section" className="py-10 md:py-14">
      <SectionHeading
        as="h1"
        title="Browse extensions"
        body="Search the directory, then narrow by kind, category, or whether the source was checked."
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
