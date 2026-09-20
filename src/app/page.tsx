import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Hero } from "@/components/home/Hero";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { InstallFlow } from "@/components/home/InstallFlow";
import { KindExplorer } from "@/components/home/KindExplorer";
import { TrustModel } from "@/components/home/TrustModel";
import { pickFeatured, pickInstallExamples } from "@/components/home/home-data";
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

  return (
    <>
      <Hero extensions={allExtensions} />
      <KindExplorer counts={countByKind()} />
      <FeaturedSection extensions={pickFeatured(featuredExtensions, allExtensions)} />
      <InstallFlow examples={pickInstallExamples(featuredExtensions)} />
      <TrustModel catalogDate={getCatalogGeneratedAt()} />
    </>
  );
}
