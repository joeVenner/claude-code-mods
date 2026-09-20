import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DISCLAIMER, resolveSiteUrl } from "@/lib/site";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  it("carries the unofficial disclaimer and the verification caveat", () => {
    render(<SiteFooter />);
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByText(/It is not a security review\./)).toBeInTheDocument();
  });

  it("shows the catalog date only when provided", () => {
    const { rerender } = render(<SiteFooter />);
    expect(screen.queryByText(/Catalog data generated/)).not.toBeInTheDocument();

    rerender(<SiteFooter catalogDate="2026-05-01" />);
    expect(screen.getByText("2026-05-01")).toHaveAttribute("datetime", "2026-05-01");
  });

  it("links to the main sections", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("link", { name: "Security" }).getAttribute("href")).toMatch(/^\/security\/?$/);
  });
});

describe("resolveSiteUrl", () => {
  it("defaults to localhost when unset or malformed", () => {
    expect(resolveSiteUrl(undefined)).toBe("http://localhost:3000");
    expect(resolveSiteUrl("")).toBe("http://localhost:3000");
    expect(resolveSiteUrl("not a url")).toBe("http://localhost:3000");
    expect(resolveSiteUrl("javascript:alert(1)")).toBe("http://localhost:3000");
  });

  it("normalises valid URLs to an origin", () => {
    expect(resolveSiteUrl("https://example.com/")).toBe("https://example.com");
    expect(resolveSiteUrl("https://example.com/some/path")).toBe("https://example.com");
  });
});
