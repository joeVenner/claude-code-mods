import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ExtensionDetail } from "@/components/detail/ExtensionDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllExtensions, getExtensionBySlug, getRelatedExtensions } from "@/lib/catalog";
import { buildExtensionGraph } from "@/lib/seo/jsonLd";
import { buildExtensionMetadata } from "@/lib/seo/metadata";

// Static export: only slugs from the catalog exist, anything else is a 404.
export const dynamicParams = false;

interface ExtensionPageProps {
  readonly params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return getAllExtensions().map((extension) => ({ slug: extension.slug }));
}

export async function generateMetadata({ params }: ExtensionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const extension = getExtensionBySlug(slug);
  if (extension === undefined) return {};
  return buildExtensionMetadata(extension);
}

export default async function ExtensionPage({ params }: ExtensionPageProps): Promise<ReactNode> {
  const { slug } = await params;
  const extension = getExtensionBySlug(slug);
  if (extension === undefined) notFound();
  return (
    <>
      <JsonLd data={buildExtensionGraph(extension)} />
      <ExtensionDetail extension={extension} related={getRelatedExtensions(slug)} />
    </>
  );
}
