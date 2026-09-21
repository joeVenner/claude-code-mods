import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { readFileSync } from "node:fs";
import path from "node:path";
import { selectAnthropicBuiltInMods, sharedNotice } from "@/components/docs/builtInMods";
import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { getIdeas } from "@/lib/ideas";
import { DISCLAIMER, VERIFICATION_NOTE } from "@/lib/site";
import AboutPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("about page", () => {
  it("has exactly one h1 and no em or en dashes", () => {
    const { container } = render(<AboutPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
  });

  it("carries the unofficial disclaimer and says nothing was reviewed or scanned", () => {
    render(<AboutPage />);
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByText(/nothing on this site says a listing was reviewed or scanned/)).toBeInTheDocument();
  });

  it("explains what a mod is from the real mods README", () => {
    const { container } = render(<AboutPage />);
    const section = within(container.querySelector("#mods") as HTMLElement);
    expect(section.getByRole("heading", { name: "What a mod is" })).toBeInTheDocument();
    expect(section.getByText(/Claude Code plugin whose behaviour lives in a hooks module/)).toBeInTheDocument();
  });

  it("scopes 'ship inside Claude Code' to Anthropic's built-in mods, using the catalog's own data", () => {
    const { container } = render(<AboutPage />);
    const builtIn = selectAnthropicBuiltInMods(getAllExtensions());
    const section = within(container.querySelector("#mods") as HTMLElement);
    expect(builtIn.length).toBeGreaterThan(0);
    expect(section.getByText(new RegExp(`Anthropic publishes ${builtIn.length} mods that ship inside\\s+Claude Code`))).toBeInTheDocument();
    const notice = sharedNotice(builtIn);
    if (notice !== null) {
      expect(section.getByText(`Their listings carry this notice: ${notice}`)).toBeInTheDocument();
    }
    const text = section.getByText(/ship inside/).textContent ?? "";
    expect(text).not.toMatch(/community/i);
  });

  it("hardcodes no entry names, repository names or early-access claims in its source", () => {
    const source = readFileSync(path.join(process.cwd(), "src/app/about/page.tsx"), "utf8");
    expect(source).not.toMatch(/sec-default|anthropics\/claude-code|early access/i);
  });

  it("links every mod in the catalog to its page and to the mod browse filter", () => {
    const { container } = render(<AboutPage />);
    const mods = getAllExtensions().filter((extension) => extension.kind === "mod");
    expect(mods.length).toBeGreaterThan(0);
    const section = within(container.querySelector("#mods") as HTMLElement);
    for (const mod of mods) {
      expect(section.getByRole("link", { name: mod.name }).getAttribute("href")).toMatch(
        new RegExp(`^/extensions/${mod.slug}/?$`),
      );
    }
    expect(section.getByRole("link", { name: "Browse the mods" }).getAttribute("href")).toMatch(/^\/browse\/?\?kind=mod$/);
  });

  it("describes the other kinds of extension", () => {
    const { container } = render(<AboutPage />);
    const section = within(container.querySelector("#kinds") as HTMLElement);
    for (const term of ["Plugin", "Skill", "Agent", "Hook", "MCP server", "Command"]) {
      expect(section.getByText(term)).toBeInTheDocument();
    }
  });

  it("derives entry counts and the catalog date from the catalog", () => {
    render(<AboutPage />);
    const total = getAllExtensions().length;
    expect(screen.getByText(new RegExp(`holds ${total}\\s+entries`))).toBeInTheDocument();
    expect(screen.getByText(getCatalogGeneratedAt())).toBeInTheDocument();
  });

  it("says what Source verified means and that it is not a security review", () => {
    render(<AboutPage />);
    expect(screen.getByText(VERIFICATION_NOTE)).toBeInTheDocument();
    expect(screen.getByText(/returned HTTP 200 on the date shown on the entry/)).toBeInTheDocument();
  });

  it("shows how to re-check with both catalog commands", () => {
    render(<AboutPage />);
    expect(screen.getByText("npm run catalog:verify")).toBeInTheDocument();
    expect(screen.getByText("npm run catalog:structure")).toBeInTheDocument();
  });

  it("points to the ideas page and says ideas are outside the directory", () => {
    const { container } = render(<AboutPage />);
    const section = within(container.querySelector("#ideas") as HTMLElement);
    expect(section.getByRole("link", { name: "Ideas page" }).getAttribute("href")).toMatch(/^\/ideas\/?$/);
    expect(section.getByText(new RegExp(`describes ${getIdeas().length} mods that nobody has published`))).toBeInTheDocument();
  });

  it("never calls the mods runtime unconfirmed or presents entries as concepts", () => {
    const { container } = render(<AboutPage />);
    expect(container.textContent).not.toMatch(/unconfirmed|could not confirm|concept/i);
  });

  it("exports metadata with a canonical path", () => {
    expect(metadata.alternates?.canonical).toBe("/about/");
  });
});
