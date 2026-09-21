import { SITE_URL } from "@/lib/site";
import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/ui/testSupport";
import { buildExtensionMetadata } from "@/lib/seo/metadata";
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
    const expected = buildExtensionMetadata(entry);
    // Exact values, not fragments: a mod name is short enough for the "<name>, a mod for Claude Code" form.
    expect(entry.kind).toBe("mod");
    expect(metadata.title).toBe(`${entry.name}, a mod for Claude Code`);
    expect(metadata.description).toBe(expected.description);
    expect(String(metadata.description).startsWith(entry.summary)).toBe(true);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/extensions/${entry.slug}/`);
  });

  it("returns empty metadata for an unknown slug", async () => {
    expect(await generateMetadata({ params: paramsFor("no-such-entry") })).toEqual({});
  });

  it("throws the not-found signal for an unknown slug", async () => {
    await expect(ExtensionPage({ params: paramsFor("no-such-entry") })).rejects.toThrow();
  });

  it.each(getAllExtensions().map((extension) => [extension.slug, extension.name] as const))(
    "renders %s with one h1, no dashes and no concept wording",
    async (slug, name) => {
      const { container } = render(await ExtensionPage({ params: paramsFor(slug) }));
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(name);
      expect(container.textContent).not.toMatch(DASH_PATTERN);
      expect(container.textContent).not.toMatch(/concept/i);
    },
  );

  describe("mod pages", () => {
    const mods = getAllExtensions().filter((extension) => extension.kind === "mod");

    it("exist in the catalog", () => {
      expect(mods.length).toBeGreaterThan(0);
    });

    it.each(mods.map((mod) => [mod.slug] as const))(
      "%s has a guide with set up and download sections, unique anchors and no install rows",
      async (slug) => {
        const mod = getAllExtensions().find((extension) => extension.slug === slug);
        expect(mod?.guide.length ?? 0).toBeGreaterThan(0);
        const { container } = render(await ExtensionPage({ params: paramsFor(slug) }));

        const h2Titles = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent ?? "");
        expect(h2Titles.some((title) => /set up/i.test(title))).toBe(true);
        expect(h2Titles.some((title) => /download/i.test(title))).toBe(true);

        const ids = Array.from(container.querySelectorAll("[id]")).map((element) => element.id);
        expect(new Set(ids).size).toBe(ids.length);

        const toc = screen.getByRole("navigation", { name: "On this page" });
        for (const link of within(toc).getAllByRole("link")) {
          expect(document.getElementById((link.getAttribute("href") ?? "").replace(/^#/, ""))).not.toBeNull();
        }
        expect(container.textContent).not.toMatch(DASH_PATTERN);
        expect(screen.getByRole("heading", { level: 2, name: "Install" })).toBeInTheDocument();
        expect(screen.getByText(/^Built in\. This ships inside Claude Code/)).toBeInTheDocument();
      },
    );
  });
});
