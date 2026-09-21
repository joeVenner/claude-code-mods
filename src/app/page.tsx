import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Hero } from "@/components/home/Hero";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { InstallFlow } from "@/components/home/InstallFlow";
import { KindExplorer } from "@/components/home/KindExplorer";
import { TrustModel } from "@/components/home/TrustModel";
import {
  describeBuiltInMods,
  pickFeatured,
  pickInstallExamples,
  pickRunFromSource,
  selectBuiltInMods,
} from "@/components/home/home-data";
import { toListItems } from "@/components/catalog/ExtensionListItem";
import {
  countByKind,
  getAllExtensions,
  getCatalogGeneratedAt,
  getFeaturedExtensions,
} from "@/lib/catalog";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildHomeGraph } from "@/lib/seo/jsonLd";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata: Metadata = buildStaticPageMetadata(PAGE_SEO.home);

/** Landing page. All data is read at build time; only the hero search runs in the browser. */
export default function HomePage(): ReactNode {
  const allExtensions = getAllExtensions();
  const featuredExtensions = getFeaturedExtensions();
  const featuredPick = pickFeatured(featuredExtensions, allExtensions);

  return (
    <>
      <JsonLd data={buildHomeGraph()} />
      <Hero extensions={toListItems(allExtensions)} />
      <KindExplorer counts={countByKind()} builtInModsNote={describeBuiltInMods(allExtensions)} />
      <FeaturedSection extensions={featuredPick.extensions} isEditorialPick={featuredPick.isEditorial} />
      <InstallFlow
        examples={pickInstallExamples(allExtensions)}
        runFromSource={pickRunFromSource(featuredExtensions)}
      />
      <TrustModel catalogDate={getCatalogGeneratedAt()} builtInMods={selectBuiltInMods(allExtensions)} />
    </>
  );
}
