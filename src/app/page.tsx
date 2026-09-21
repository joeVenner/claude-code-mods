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
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME}: community directory for Claude Code extensions` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

/** Landing page. All data is read at build time; only the hero search runs in the browser. */
export default function HomePage(): ReactNode {
  const allExtensions = getAllExtensions();
  const featuredExtensions = getFeaturedExtensions();
  const featuredPick = pickFeatured(featuredExtensions, allExtensions);

  return (
    <>
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
