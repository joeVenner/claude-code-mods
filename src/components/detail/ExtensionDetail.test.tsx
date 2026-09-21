import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import {
  builtInModExtension,
  sourceOnlyExtension,
  verifiedExtension,
} from "@/components/catalog/__fixtures__/extensions";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/ui/testSupport";
import type { Extension } from "@/lib/types";
import { hookEventHrefs } from "@/lib/event-names";
import { ExtensionDetail } from "./ExtensionDetail";
import { collectExtensionLinks } from "./ExtensionLinks";
import { BUILT_IN_EXPLANATION, NO_INSTALL_COMMAND } from "./InstallSection";

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

describe("ExtensionDetail: installable entry chips", () => {
  it("shows the availability chip beside the verification badge", () => {
    render(<ExtensionDetail extension={verifiedExtension} related={[]} />);
    expect(screen.getByText("Installable")).toBeInTheDocument();
    expect(screen.getByText("Source verified")).toBeInTheDocument();
    expect(screen.queryByText("Notice")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "On this page" })).not.toBeInTheDocument();
  });

  it("keeps the description paragraphs when there is no guide", () => {
    render(<ExtensionDetail extension={verifiedExtension} related={[]} />);
    expect(screen.getByText("Fixture description paragraph.")).toBeInTheDocument();
  });
});

describe("ExtensionDetail: publisher signal", () => {
  const note = "Community listing. Not published by Anthropic; a maintainer read the entry, not the code.";

  it("labels a community entry with a chip next to the badge and a plain line under the publisher", () => {
    expect(verifiedExtension.publisher.kind).toBe("community");
    render(<ExtensionDetail extension={verifiedExtension} related={[]} />);
    expect(screen.getByText("Community listing", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Source verified")).toBeInTheDocument();
    const publisher = screen.getByText("Publisher").closest("div") as HTMLElement;
    expect(within(publisher).getByText(note)).toBeInTheDocument();
  });

  it("does not let an Anthropic looking name stand in for the label", () => {
    const lookalike = withOverrides(verifiedExtension, {
      publisher: { name: "Anthropic", url: null, kind: "community" },
    });
    render(<ExtensionDetail extension={lookalike} related={[]} />);
    expect(screen.getByText(note)).toBeInTheDocument();
  });

  it("shows no community wording for an Anthropic entry", () => {
    expect(builtInModExtension.publisher.kind).toBe("anthropic");
    const { container } = render(<ExtensionDetail extension={builtInModExtension} related={[]} />);
    expect(container.textContent ?? "").not.toMatch(/community listing/i);
    expect(screen.getByText("Fixture Vendor")).toBeInTheDocument();
  });
});

describe("ExtensionDetail: source-only entry", () => {
  it("states there is no install command and shows no copy rows", () => {
    render(<ExtensionDetail extension={sourceOnlyExtension} related={[]} />);
    expect(screen.getByText("Source only")).toBeInTheDocument();
    expect(screen.getByText(NO_INSTALL_COMMAND)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy command/i })).not.toBeInTheDocument();
    expect(screen.queryByText("License")).not.toBeInTheDocument();
    expect(screen.queryByText(/\bstars?\b/i)).not.toBeInTheDocument();
  });
});

describe("ExtensionDetail: mod with a guide", () => {
  const mod = builtInModExtension;

  it("renders one h1, the availability chip and the notice as a labelled warning callout", () => {
    render(<ExtensionDetail extension={mod} related={[]} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Built in", { selector: "span" })).toBeInTheDocument();
    const callout = screen.getAllByRole("note").find((note) => note.getAttribute("data-tone") === "warning");
    expect(callout).toBeDefined();
    if (callout === undefined) return;
    expect(callout).toHaveTextContent("Notice");
    expect(callout).toHaveTextContent(mod.notice ?? "missing");
    expect(callout.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders no notice callout when the entry has none", () => {
    render(<ExtensionDetail extension={{ ...mod, notice: null }} related={[]} />);
    expect(screen.queryByText("Notice")).not.toBeInTheDocument();
  });

  it("explains built-in availability and renders no install rows or install commands", () => {
    render(<ExtensionDetail extension={mod} related={[]} />);
    const install = screen.getByRole("heading", { level: 2, name: "Install" }).closest("section");
    expect(install).not.toBeNull();
    expect(within(install as HTMLElement).getByText(BUILT_IN_EXPLANATION)).toBeInTheDocument();
    expect(within(install as HTMLElement).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(NO_INSTALL_COMMAND)).not.toBeInTheDocument();
  });

  it("renders details as a definition list with copy rows for command values only", () => {
    render(<ExtensionDetail extension={mod} related={[]} />);
    const section = screen.getByRole("heading", { level: 2, name: "Details" }).closest("section") as HTMLElement;
    expect(within(section).getByText("Seated")).toBeInTheDocument();
    expect(within(section).getByText("Built in")).toBeInTheDocument();
    expect(within(section).getByText("claude --plugin-dir mods/fixture-pane-mod")).toBeInTheDocument();
    expect(
      within(section).getByRole("button", { name: "Copy command: Run from source" }),
    ).toBeInTheDocument();
    expect(within(section).getAllByRole("button")).toHaveLength(2);
    expect(section.querySelector("dl")).not.toBeNull();
  });

  it("lists hooks under the mod heading, keeping wildcard events as text", () => {
    render(<ExtensionDetail extension={mod} related={[]} />);
    const section = screen.getByRole("heading", { level: 2, name: "Hooks it registers" }).closest("section");
    expect(screen.queryByRole("heading", { name: "Lifecycle hooks" })).not.toBeInTheDocument();
    expect(within(section as HTMLElement).getByText("classic.*")).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText("session.start")).toBeInTheDocument();
  });

  it("links a hook that has an href to its event row and leaves the others as text", () => {
    render(
      <ExtensionDetail
        extension={mod}
        related={[]}
        hookHrefs={new Map([["session.start", "/hooks/#event-session.start"]])}
      />,
    );
    const section = screen.getByRole("heading", { level: 2, name: "Hooks it registers" }).closest("section") as HTMLElement;
    const link = within(section).getByRole("link", { name: "session.start" });
    expect(link.getAttribute("href")).toMatch(/^\/hooks\/?#event-session\.start$/);
    expect(within(section).queryByRole("link", { name: "classic.*" })).not.toBeInTheDocument();
    expect(within(section).getByText("classic.*")).toBeInTheDocument();
  });

  it("marks a linked hook with an underline and a title, so it is not told apart by hover alone", () => {
    render(<ExtensionDetail extension={mod} related={[]} hookHrefs={new Map([["session.start", "/hooks/#event-session.start"]])} />);
    const link = screen.getByRole("link", { name: "session.start" });
    expect(link).toHaveAttribute("title", "Open in the event reference");
    expect(within(link).getByText("session.start").className).toContain("underline");
    expect(screen.getByText("classic.*").className).not.toContain("underline");
  });

  it("renders an entry whose hooks are the names every object inherits, instead of failing the build", () => {
    const hostile = withOverrides(mod, { hooks: ["constructor", "__proto__", "toString", "hasOwnProperty"] });
    const hrefs = hookEventHrefs(hostile.hooks, [{ name: "tool.call" }], "/hooks/", true);
    render(<ExtensionDetail extension={hostile} related={[]} hookHrefs={hrefs} />);
    const section = screen.getByRole("heading", { level: 2, name: "Hooks it registers" }).closest("section") as HTMLElement;
    for (const name of ["constructor", "__proto__", "toString", "hasOwnProperty"]) expect(within(section).getByText(name)).toBeInTheDocument();
    expect(within(section).queryAllByRole("link")).toHaveLength(0);
  });

  it("shows every hook as text when the page passes no links", () => {
    render(<ExtensionDetail extension={mod} related={[]} />);
    const section = screen.getByRole("heading", { level: 2, name: "Hooks it registers" }).closest("section") as HTMLElement;
    expect(within(section).queryAllByRole("link")).toHaveLength(0);
  });

  it("shows the stored license exactly and no stars", () => {
    render(<ExtensionDetail extension={mod} related={[]} />);
    expect(screen.getByText(mod.license ?? "missing")).toBeInTheDocument();
    expect(screen.queryByText(/\bstars?\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/open source/i)).not.toBeInTheDocument();
  });

  it("renders every guide section as an h2 in order, with paragraphs", () => {
    render(<ExtensionDetail extension={mod} related={[]} />);
    const headings = mod.guide.map((section) => screen.getByRole("heading", { level: 2, name: section.title }));
    const positions = headings.map((heading) => Array.from<Element>(document.querySelectorAll("h2")).indexOf(heading));
    expect([...positions].sort((left, right) => left - right)).toEqual(positions);
    expect(screen.getByText("Fixture overview paragraph one.")).toBeInTheDocument();
    expect(screen.getByText("Fixture setup paragraph.")).toBeInTheDocument();
  });

  it("gives every section a unique id that matches a link in the table of contents", () => {
    render(<ExtensionDetail extension={mod} related={[]} />);
    const nav = screen.getByRole("navigation", { name: "On this page" });
    const tocLinks = within(nav).getAllByRole("link");
    expect(tocLinks.map((link) => link.textContent)).toEqual(mod.guide.map((section) => section.title));
    const hrefs = tocLinks.map((link) => link.getAttribute("href") ?? "");
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const [index, section] of mod.guide.entries()) {
      const id = hrefs[index].replace(/^#/, "");
      const heading = document.getElementById(id);
      expect(heading?.tagName).toBe("H2");
      expect(heading).toHaveTextContent(section.title);
    }
  });

  it("offers a collapsed table of contents for small screens without a second landmark", () => {
    const { container } = render(<ExtensionDetail extension={mod} related={[]} />);
    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    expect(details?.querySelectorAll("a")).toHaveLength(mod.guide.length);
    expect(screen.getAllByRole("navigation", { name: "On this page" })).toHaveLength(1);
  });

  it("renders guide commands as consecutive copy rows in stored order with distinct names", () => {
    render(<ExtensionDetail extension={mod} related={[]} />);
    const setUp = screen.getByRole("heading", { level: 2, name: "Set up" }).closest("section") as HTMLElement;
    const rows = within(setUp).getAllByRole("button");
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
      "Copy command: Set up, step 1 of 2",
      "Copy command: Set up, step 2 of 2",
    ]);
    const commands = Array.from(setUp.querySelectorAll("code")).map((code) => code.textContent);
    expect(commands).toEqual(mod.guide[1].commands);
    const download = screen.getByRole("heading", { level: 2, name: "Download the source" }).closest("section");
    expect(within(download as HTMLElement).getByRole("button", { name: "Copy command: Download the source" })).toBeInTheDocument();
  });

  it("omits the table of contents landmark when the guide is empty", () => {
    const { container } = render(<ExtensionDetail extension={{ ...mod, guide: [] }} related={[]} />);
    expect(screen.queryByRole("navigation", { name: "On this page" })).not.toBeInTheDocument();
    expect(container.querySelector("details")).toBeNull();
    // Without a guide the description takes over as body text.
    expect(screen.getByText("Fixture mod paragraph one.")).toBeInTheDocument();
  });
});

describe("ExtensionDetail: related extensions", () => {
  it("omits the section when nothing is related", () => {
    render(<ExtensionDetail extension={verifiedExtension} related={[]} />);
    expect(screen.queryByRole("heading", { name: "Related extensions" })).not.toBeInTheDocument();
  });

  it("renders cards under an h2 when related entries exist", () => {
    render(<ExtensionDetail extension={verifiedExtension} related={[sourceOnlyExtension]} />);
    expect(screen.getByRole("heading", { level: 2, name: "Related extensions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Fixture Source Only" })).toBeInTheDocument();
  });
});

describe("ExtensionDetail: copy hygiene", () => {
  it.each([
    ["verified", verifiedExtension],
    ["built-in mod", builtInModExtension],
    ["source-only", sourceOnlyExtension],
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

  it("lists the repository and the entry's own links for a mod", () => {
    const links = collectExtensionLinks(builtInModExtension);
    expect(links[0]).toEqual({ label: "Source repository", url: builtInModExtension.repositoryUrl });
  });
});
