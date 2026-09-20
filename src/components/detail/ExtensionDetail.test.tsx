import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { conceptExtension, verifiedExtension } from "@/components/catalog/__fixtures__/extensions";
import type { Extension } from "@/lib/types";
import { ExtensionDetail } from "./ExtensionDetail";
import { collectExtensionLinks } from "./ExtensionLinks";
import { CONCEPT_NOT_INSTALLABLE, NO_INSTALL_COMMAND } from "./InstallSection";

beforeAll(stubIntersectionObserver);

function withOverrides(base: Extension, overrides: Partial<Extension>): Extension {
  return { ...base, ...overrides };
}

describe("ExtensionDetail: verified entry with install commands", () => {
  const extension = withOverrides(verifiedExtension, {
    installCommands: ["/plugin marketplace add fixture-org/fixture", "/plugin install fixture-lint-runner@fixture"],
    links: [{ label: "Docs", url: "https://docs.example.org/fixture" }],
    publisher: { name: "Fixture Publisher", url: "https://github.com/fixture-org", kind: "community" },
  });

  it("renders exactly one h1 with the name, plus kind, badge, license and stars with capture date", () => {
    render(<ExtensionDetail extension={extension} related={[]} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Fixture Lint Runner" })).toBeInTheDocument();
    expect(screen.getByText("Plugin")).toBeInTheDocument();
    expect(screen.getByText("Source verified")).toBeInTheDocument();
    expect(screen.getByText("MIT")).toBeInTheDocument();
    expect(screen.getByText("1,234 stars")).toBeInTheDocument();
    expect(screen.getByText(/as of 2026-05-01/)).toBeInTheDocument();
  });

  it("renders one copy row per install command", () => {
    render(<ExtensionDetail extension={extension} related={[]} />);
    for (const command of extension.installCommands) {
      expect(screen.getByText(command)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: /copy command/i })).toHaveLength(2);
    expect(screen.queryByText(NO_INSTALL_COMMAND)).not.toBeInTheDocument();
  });

  it("links the publisher only because its url is non-null", () => {
    render(<ExtensionDetail extension={extension} related={[]} />);
    expect(screen.getByRole("link", { name: /Fixture Publisher/ })).toHaveAttribute(
      "href",
      "https://github.com/fixture-org",
    );
  });

  it("opens external links in a new tab with noopener", () => {
    render(<ExtensionDetail extension={extension} related={[]} />);
    const repositoryLink = screen.getByRole("link", { name: /Source repository/ });
    expect(repositoryLink).toHaveAttribute("href", extension.repositoryUrl);
    expect(repositoryLink).toHaveAttribute("target", "_blank");
    expect(repositoryLink).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByRole("link", { name: /Docs/ })).toHaveAttribute("href", "https://docs.example.org/fixture");
  });

  it("states the verification date and that it is not a security review", () => {
    render(<ExtensionDetail extension={extension} related={[]} />);
    expect(screen.getByText(/Source verified on/)).toHaveTextContent(
      "Source verified on 2026-05-02. Not a security review.",
    );
    expect(screen.getByRole("heading", { name: "What the badge means" })).toBeInTheDocument();
  });

  it("lists lifecycle hooks as chips under the agreed label", () => {
    render(<ExtensionDetail extension={extension} related={[]} />);
    const section = screen.getByRole("heading", { name: "Lifecycle hooks" }).closest("section");
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).getByText("PostToolUse")).toBeInTheDocument();
    expect(screen.queryByText(/not confirmed Claude Code hook names/)).not.toBeInTheDocument();
  });

  it("links back to browse", () => {
    render(<ExtensionDetail extension={extension} related={[]} />);
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumb).getByRole("link", { name: "Browse" }).getAttribute("href")).toMatch(/^\/browse\/?$/);
  });
});

describe("ExtensionDetail: verified entry without install commands", () => {
  it("explains the missing command instead of leaving the install block empty", () => {
    render(<ExtensionDetail extension={withOverrides(verifiedExtension, { installCommands: [] })} related={[]} />);
    expect(screen.getByText(NO_INSTALL_COMMAND)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy command/i })).not.toBeInTheDocument();
    expect(screen.queryByText(CONCEPT_NOT_INSTALLABLE)).not.toBeInTheDocument();
  });

  it("omits the hooks section when there are no hooks", () => {
    render(<ExtensionDetail extension={withOverrides(verifiedExtension, { hooks: [] })} related={[]} />);
    expect(screen.queryByRole("heading", { name: "Lifecycle hooks" })).not.toBeInTheDocument();
  });

  it("omits stars and license rows when absent", () => {
    render(
      <ExtensionDetail extension={withOverrides(verifiedExtension, { stars: null, license: null })} related={[]} />,
    );
    expect(screen.queryByText(/stars?$/)).not.toBeInTheDocument();
    expect(screen.queryByText("License")).not.toBeInTheDocument();
  });
});

describe("ExtensionDetail: concept entry", () => {
  it("shows a top notice, the not-installable callout and the spec reference", () => {
    render(<ExtensionDetail extension={conceptExtension} related={[]} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText(/This is a concept, not a shipping extension/)).toBeInTheDocument();
    expect(screen.getByText(CONCEPT_NOT_INSTALLABLE)).toBeInTheDocument();
    expect(screen.getByText(/Spec reference: Fixture spec section/)).toBeInTheDocument();
    expect(screen.getByText("Concept")).toBeInTheDocument();
    expect(screen.queryByText("Source verified")).not.toBeInTheDocument();
  });

  it("renders no stars, no copy rows and no repository link", () => {
    render(<ExtensionDetail extension={conceptExtension} related={[]} />);
    expect(screen.queryByText(/stars?\b/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy command/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Source repository/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Verified source/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Source verified on/)).not.toBeInTheDocument();
  });

  it("never shows stars even if malformed data slips a count onto a concept", () => {
    const malformed = withOverrides(conceptExtension, { stars: { count: 99, capturedAt: "2026-05-01" } });
    render(<ExtensionDetail extension={malformed} related={[]} />);
    expect(screen.queryByText(/99/)).not.toBeInTheDocument();
  });

  it("flags the unconfirmed mods runtime only for the mod kind", () => {
    const { unmount } = render(<ExtensionDetail extension={conceptExtension} related={[]} />);
    expect(screen.getByText(/mod runtime this concept assumes is unconfirmed/)).toBeInTheDocument();
    unmount();
    render(<ExtensionDetail extension={withOverrides(conceptExtension, { kind: "hook" })} related={[]} />);
    expect(screen.queryByText(/mod runtime this concept assumes/)).not.toBeInTheDocument();
  });

  it("marks concept hook names as unconfirmed spec names", () => {
    render(<ExtensionDetail extension={withOverrides(conceptExtension, { hooks: ["turn:complete"] })} related={[]} />);
    expect(screen.getByText("turn:complete")).toBeInTheDocument();
    expect(screen.getByText(/not confirmed Claude Code hook names/)).toBeInTheDocument();
  });
});

describe("ExtensionDetail: related extensions", () => {
  it("omits the section when nothing is related", () => {
    render(<ExtensionDetail extension={verifiedExtension} related={[]} />);
    expect(screen.queryByRole("heading", { name: "Related extensions" })).not.toBeInTheDocument();
  });

  it("renders cards under an h2 when related entries exist", () => {
    render(<ExtensionDetail extension={verifiedExtension} related={[conceptExtension]} />);
    expect(screen.getByRole("heading", { level: 2, name: "Related extensions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fixture Context Trimmer" })).toBeInTheDocument();
  });
});

describe("ExtensionDetail: copy hygiene", () => {
  it.each([
    ["verified", verifiedExtension],
    ["concept", conceptExtension],
  ])("has no em or en dashes in rendered text (%s)", (_label, extension) => {
    const { container } = render(<ExtensionDetail extension={extension} related={[]} />);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
  });
});

describe("collectExtensionLinks", () => {
  it("puts the repository first and drops duplicate urls", () => {
    const extension = withOverrides(verifiedExtension, {
      links: [
        { label: "README", url: "https://github.com/fixture-org/fixture-lint-runner" },
        { label: "Docs", url: "https://docs.example.org/fixture" },
      ],
    });
    const links = collectExtensionLinks(extension);
    expect(links.map((link) => link.label)).toEqual(["Source repository", "Docs"]);
  });

  it("adds the verified source when it differs from the repository", () => {
    const extension = withOverrides(verifiedExtension, {
      verification: { status: "verified", checkedAt: "2026-05-02", sourceUrl: "https://example.org/source" },
    });
    expect(collectExtensionLinks(extension).map((link) => link.label)).toEqual([
      "Source repository",
      "Verified source",
    ]);
  });

  it("returns no links for a concept without explicit links", () => {
    expect(collectExtensionLinks(conceptExtension)).toEqual([]);
  });
});
