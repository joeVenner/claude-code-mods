import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { stubIntersectionObserver } from "@/components/home/__fixtures__/intersection-observer";
import { getAllExtensions } from "@/lib/catalog";
import type { JsonLdGraph } from "@/lib/seo/jsonLd";
import { metadata as notFoundMetadata } from "./not-found";
import ExtensionPage from "./extensions/[slug]/page";

beforeAll(stubIntersectionObserver);

function ldJsonGraphs(container: HTMLElement): readonly JsonLdGraph[] {
  return Array.from(container.querySelectorAll('script[type="application/ld+json"]')).map(
    (script) => JSON.parse(script.textContent ?? "") as JsonLdGraph,
  );
}

describe("not-found page", () => {
  it("is kept out of search results", () => {
    expect(notFoundMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(notFoundMetadata.alternates).not.toHaveProperty("canonical");
  });
});

describe("extension page structured data", () => {
  it("embeds one parseable graph with a breadcrumb and the entry as SoftwareSourceCode", async () => {
    const [entry] = getAllExtensions();
    const { container } = render(await ExtensionPage({ params: Promise.resolve({ slug: entry.slug }) }));
    const graphs = ldJsonGraphs(container);
    expect(graphs).toHaveLength(1);
    expect(graphs[0]["@graph"].map((node) => node["@type"])).toEqual(["BreadcrumbList", "SoftwareSourceCode"]);
  });
});
