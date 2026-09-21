import { SITE_URL } from "@/lib/site";
import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pickExampleMod, selectAnthropicBuiltInMods } from "@/components/docs/builtInMods";
import { getAllExtensions } from "@/lib/catalog";
import SecurityPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("security page", () => {
  it("has exactly one h1, ordered headings and no em or en dashes", () => {
    const { container } = render(<SecurityPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)));
    levels.slice(1).forEach((level, index) => {
      expect(level - levels[index]).toBeLessThanOrEqual(1);
    });
  });

  it("says plainly that no scanner is running and no listing has a tier", () => {
    render(<SecurityPage />);
    expect(
      screen.getByText(/This is a design specification\. No security scanner is running today, so no listing on this site has a tier\./),
    ).toBeInTheDocument();
  });

  it("states what is checked today: Source verified and the structure check", () => {
    const { container } = render(<SecurityPage />);
    const section = within(container.querySelector("#what-is-checked") as HTMLElement);
    expect(section.getByText("Source verified")).toBeInTheDocument();
    expect(section.getByText(/responded with HTTP 200/)).toBeInTheDocument();
    expect(section.getByText("Structure check on community submissions")).toBeInTheDocument();
    expect(section.getByText(/automated check in CI confirms that the manifest\s+files exist and parse/)).toBeInTheDocument();
    expect(section.getByText(/It is not a review of what they contain\./, { exact: false })).toBeInTheDocument();
    expect(section.getByText("npm run catalog:structure")).toBeInTheDocument();
  });

  it("explains that Source verified is not a security review", () => {
    render(<SecurityPage />);
    expect(screen.getByText(/Source verified is not a security review/)).toBeInTheDocument();
  });

  it("derives the built-in mods sentence from the catalog and quotes one entry's own summary", () => {
    const { container } = render(<SecurityPage />);
    const builtIn = selectAnthropicBuiltInMods(getAllExtensions());
    const example = pickExampleMod(builtIn);
    expect(example).toBeDefined();
    const section = within(container.querySelector("#built-in-mods") as HTMLElement);
    expect(section.getByText(new RegExp(`lists ${builtIn.length} mods published by Anthropic\\s+that ship inside Claude Code`))).toBeInTheDocument();
    expect(section.getByText(example?.summary as string)).toBeInTheDocument();
    expect(section.getByText(/says no more about what it does than that text/)).toBeInTheDocument();
    expect(section.getByRole("link", { name: example?.name as string }).getAttribute("href")).toMatch(
      new RegExp(`^/extensions/${example?.slug}/?$`),
    );
  });

  it("hardcodes no entry slug or name in its source", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/security/page.tsx"), "utf8");
    expect(source).not.toMatch(/sec-default|SECURITY_MOD_SLUG|getExtensionBySlug/);
  });

  it("lists all four tiers and marks each behavior as proposed", () => {
    render(<SecurityPage />);
    for (const tier of ["TIER_A", "TIER_B", "TIER_C", "REVOKED"]) {
      expect(screen.getByText(tier)).toBeInTheDocument();
    }
    expect(screen.getAllByText("Proposed CLI behavior")).toHaveLength(4);
  });

  it("renders the four-step scan pipeline as an ordered timeline", () => {
    render(<SecurityPage />);
    const pipeline = screen.getByRole("list", { name: "Proposed scan pipeline" });
    expect(pipeline.tagName).toBe("OL");
    expect(within(pipeline).getAllByRole("heading", { level: 4 })).toHaveLength(4);
  });

  it("gives practical pre-install guidance under a linkable section", () => {
    const { container } = render(<SecurityPage />);
    const section = container.querySelector("#before-you-install");
    expect(section).not.toBeNull();
    for (const title of ["Read the source", "Check the publisher", "Review permissions and hooks", "Prefer pinned versions"]) {
      expect(within(section as HTMLElement).getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });

  it("never uses concept wording or calls the mods runtime unconfirmed", () => {
    const { container } = render(<SecurityPage />);
    expect(container.textContent).not.toMatch(/unconfirmed|could not confirm|concept/i);
  });

  it("exports page metadata with a canonical path", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/security/`);
    expect(metadata.title).toBe("Security: what is and is not checked");
  });
});
