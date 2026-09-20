import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { getAllExtensions } from "@/lib/catalog";
import ExtensionPage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

beforeAll(stubIntersectionObserver);

function paramsFor(slug: string): Promise<{ slug: string }> {
  return Promise.resolve({ slug });
}

describe("extension detail route", () => {
  it("generates a static param for every catalog slug, once each", () => {
    const params = generateStaticParams();
    const slugs = getAllExtensions().map((extension) => extension.slug);
    expect(params.map((param) => param.slug)).toEqual(slugs);
    expect(new Set(params.map((param) => param.slug)).size).toBe(slugs.length);
  });

  it("returns 404 for slugs outside the catalog on the static export", () => {
    expect(dynamicParams).toBe(false);
  });

  it("builds metadata from the entry title, summary and canonical path", async () => {
    const [entry] = getAllExtensions();
    const metadata = await generateMetadata({ params: paramsFor(entry.slug) });
    expect(metadata.title).toBe(entry.name);
    expect(metadata.description).toBe(entry.summary);
    expect(metadata.alternates?.canonical).toBe(`/extensions/${entry.slug}/`);
  });

  it("returns empty metadata for an unknown slug", async () => {
    expect(await generateMetadata({ params: paramsFor("no-such-entry") })).toEqual({});
  });

  it("throws the not-found signal for an unknown slug", async () => {
    await expect(ExtensionPage({ params: paramsFor("no-such-entry") })).rejects.toThrow();
  });

  it.each(getAllExtensions().map((extension) => [extension.slug, extension.name] as const))(
    "renders %s with one h1, no dashes and no invented stars for concepts",
    async (slug, name) => {
      const entry = getAllExtensions().find((extension) => extension.slug === slug);
      const { container } = render(await ExtensionPage({ params: paramsFor(slug) }));
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(name);
      expect(container.textContent).not.toMatch(DASH_PATTERN);
      if (entry?.verification.status === "concept") {
        expect(screen.queryByRole("button", { name: /copy command/i })).not.toBeInTheDocument();
        expect(screen.getByText(/Not installable/)).toBeInTheDocument();
      }
    },
  );
});
