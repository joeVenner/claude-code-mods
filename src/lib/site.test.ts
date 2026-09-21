import { describe, expect, it } from "vitest";
import { COMMUNITY_REPOSITORY_URL, DISCLAIMER, NAV_LINKS, SITE_DESCRIPTION, SITE_TAGLINE, isNavLinkActive, resolveSiteUrl } from "./site";

describe("NAV_LINKS", () => {
  it("lists five short destinations so the header fits on one line", () => {
    expect(NAV_LINKS.map((link) => link.label)).toEqual(["Browse", "Ideas", "Security", "Publish", "About"]);
    for (const link of NAV_LINKS) {
      expect(link.label.length).toBeLessThanOrEqual(8);
    }
  });

  it("includes the ideas page with an internal trailing-slash path", () => {
    expect(NAV_LINKS).toContainEqual({ label: "Ideas", href: "/ideas/" });
  });

  it("uses unique internal paths that end with a slash", () => {
    const hrefs = NAV_LINKS.map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/[a-z-]+\/$/);
    }
  });
});

describe("isNavLinkActive", () => {
  const browse = NAV_LINKS[0];
  const ideas = NAV_LINKS.find((link) => link.href === "/ideas/");

  it("marks the ideas link active on its own page and not on others", () => {
    expect(ideas).toBeDefined();
    expect(isNavLinkActive("/ideas/", ideas as (typeof NAV_LINKS)[number])).toBe(true);
    expect(isNavLinkActive("/ideas", ideas as (typeof NAV_LINKS)[number])).toBe(true);
    expect(isNavLinkActive("/browse/", ideas as (typeof NAV_LINKS)[number])).toBe(false);
  });

  it("keeps Browse active on extension detail pages", () => {
    expect(isNavLinkActive("/extensions/diff/", browse)).toBe(true);
  });
});

describe("site copy", () => {
  it("says the directory is unofficial", () => {
    expect(DISCLAIMER).toBe("Unofficial community directory. Not affiliated with or endorsed by Anthropic.");
  });

  it("presents mods first and no longer calls them concepts", () => {
    expect(SITE_TAGLINE).toContain("mods");
    expect(SITE_DESCRIPTION).toContain("mods");
    expect(`${SITE_TAGLINE} ${SITE_DESCRIPTION}`).not.toMatch(/concept/i);
  });
});

describe("COMMUNITY_REPOSITORY_URL", () => {
  it("is a plain https github.com repository URL without a trailing slash", () => {
    expect(COMMUNITY_REPOSITORY_URL).toBe("https://github.com/joeVenner/claude-code-mods");
    expect(COMMUNITY_REPOSITORY_URL.endsWith("/")).toBe(false);
  });
});

describe("resolveSiteUrl", () => {
  it("falls back to the local default for missing or malformed values", () => {
    expect(resolveSiteUrl(undefined)).toBe("http://localhost:3000");
    expect(resolveSiteUrl("not a url")).toBe("http://localhost:3000");
    expect(resolveSiteUrl("javascript:alert(1)")).toBe("http://localhost:3000");
  });

  it("reduces a valid URL to its origin", () => {
    expect(resolveSiteUrl("https://example.org/some/path/")).toBe("https://example.org");
  });
});
