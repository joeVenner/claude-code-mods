import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import {
  COMMUNITY_LABEL,
  LICENSE_OPEN_ITEM,
  MODS_TYPES_URL,
  PLUGIN_DOCS_LINKS,
  PUBLISH_STEPS,
  RULES_FRAMING,
  SUBMISSION_RULES,
} from "@/components/docs/publishContent";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { COMMUNITY_REPOSITORY_URL } from "@/lib/site";
import { extensionSchema } from "@/lib/types";
import PublishPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("publish page", () => {
  it("has exactly one h1 and no em or en dashes", () => {
    const { container } = render(<PublishPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
  });

  it("describes a pull request flow, not a form, and renders no form controls", () => {
    const { container } = render(<PublishPage />);
    expect(screen.getByText(/There is no submission form, account system or backend/)).toBeInTheDocument();
    expect(container.querySelector("form, input, textarea, select")).toBeNull();
    const repoLink = screen.getByRole("link", { name: /joeVenner\/claude-code-mods/ });
    expect(repoLink).toHaveAttribute("href", COMMUNITY_REPOSITORY_URL);
    expect(repoLink).toHaveAttribute("target", "_blank");
  });

  it("names CONTRIBUTING.md in plain text instead of linking a file that may not exist yet", () => {
    render(<PublishPage />);
    expect(screen.getByText("CONTRIBUTING.md")).toBeInTheDocument();
    for (const anchor of screen.getAllByRole("link")) {
      expect(anchor.getAttribute("href")).not.toMatch(/CONTRIBUTING/);
    }
  });

  it("lists every step as a plain verb heading in order, with the local check commands", () => {
    const { container } = render(<PublishPage />);
    const steps = within(screen.getByRole("list", { name: "Steps to list an extension" }));
    expect(steps.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(
      PUBLISH_STEPS.map((step) => step.title),
    );
    expect(container.textContent).not.toMatch(/\bstep\s*\d/i);
    expect(screen.getByText("npm ci")).toBeInTheDocument();
    expect(
      screen.getByText("npm run catalog:verify -- --only src/data/community/<slug>.json"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("npm run catalog:structure -- --only src/data/community/<slug>.json"),
    ).toBeInTheDocument();
  });

  it("says a listing means the source exists and never that it was reviewed", () => {
    const { container } = render(<PublishPage />);
    const section = within(container.querySelector("#what-a-listing-means") as HTMLElement);
    expect(section.getByText(/listed and its source existed when the checks ran/)).toBeInTheDocument();
    expect(section.getByText(/does not\s+mean anyone reviewed, scanned or tested the code/)).toBeInTheDocument();
  });

  it("renders every submission rule under the reworded heading", () => {
    const { container } = render(<PublishPage />);
    const section = within(container.querySelector("#rules") as HTMLElement);
    expect(section.getByRole("heading", { name: "Rules every submission must meet" })).toBeInTheDocument();
    for (const rule of SUBMISSION_RULES) {
      expect(section.getByText(rule.rule)).toBeInTheDocument();
    }
    expect(container.textContent).not.toMatch(/cannot bypass/i);
  });

  it("says plainly what CI checks, what it cannot prove and what a merge means", () => {
    const { container } = render(<PublishPage />);
    const section = within(container.querySelector("#rules") as HTMLElement);
    for (const paragraph of RULES_FRAMING) {
      expect(section.getByText(paragraph)).toBeInTheDocument();
    }
    expect(section.getByText(/cannot prove that a command or a package is safe/)).toBeInTheDocument();
    expect(section.getByText(/reads the text of the entry, not the code it points to/)).toBeInTheDocument();
    expect(section.getByText(/It never means reviewed or endorsed/)).toBeInTheDocument();
  });

  it("documents the command, text, publisher, date and slug rules added for community entries", () => {
    const { container } = render(<PublishPage />);
    const text = container.querySelector("#rules")?.textContent ?? "";
    for (const expected of [
      "/plugin marketplace add <owner>/<repo>",
      "/plugin install <name>@<marketplace>",
      "claude --plugin-dir <path>",
      "git clone https://github.com/<owner>/<repo>",
      "git sparse-checkout set",
      "at most 200 characters",
      "printable ASCII",
      "npx, curl, pipes",
      "bidirectional or zero-width",
      "anthropic, claude, official or mcp",
      "share one github.com owner",
      "not a date in the future",
      "too similar",
      COMMUNITY_LABEL,
    ]) {
      expect(text).toContain(expected);
    }
  });

  it("lists the license as an open item, not a decision", () => {
    const { container } = render(<PublishPage />);
    const section = within(container.querySelector("#license") as HTMLElement);
    expect(section.getByRole("heading", { name: "Open item: license for submitted data" })).toBeInTheDocument();
    expect(section.getByText(LICENSE_OPEN_ITEM)).toBeInTheDocument();
    expect(LICENSE_OPEN_ITEM).toMatch(/no LICENSE file yet/);
    expect(LICENSE_OPEN_ITEM).not.toMatch(/\b(MIT|Apache|GPL|BSD|CC0|CC-BY)\b/);
  });

  it("renders every schema field name in the field list, including the new ones", () => {
    render(<PublishPage />);
    for (const field of Object.keys(extensionSchema.shape)) {
      expect(screen.getAllByText(field, { selector: "dt span" }).length).toBeGreaterThan(0);
    }
    for (const field of ["availability", "notice", "details", "guide"]) {
      expect(screen.getAllByText(field, { selector: "dt span" })).toHaveLength(1);
    }
  });

  it("says a mod submission must include a guide with overview, setup and download", () => {
    const { container } = render(<PublishPage />);
    const section = within(container.querySelector("#entry-fields") as HTMLElement);
    expect(section.getByText(/Required for a mod, with a section whose title contains "set up" or "setup"/)).toBeInTheDocument();
    expect(section.getByText(/one whose title contains "download"/, { exact: false })).toBeInTheDocument();
  });

  it("labels the example entry and the example guide as not real", () => {
    render(<PublishPage />);
    expect(screen.getByText(/Example, not a real listing/)).toBeInTheDocument();
    expect(screen.getByLabelText("Example catalog entry as JSON")).toHaveTextContent('"slug": "example-format-on-save"');
    expect(screen.getByText(/Example guide, not from a real mod/)).toBeInTheDocument();
    expect(screen.getByLabelText("Example guide as JSON")).toHaveTextContent('"title": "Download"');
  });

  it("explains how mods are loaded and links the engine typings", () => {
    const { container } = render(<PublishPage />);
    const section = within(container.querySelector("#mods") as HTMLElement);
    expect(section.getByText("claude --plugin-dir <path-to-mod>")).toBeInTheDocument();
    expect(section.getByText(/Function hooks must be enabled/)).toBeInTheDocument();
    expect(section.getByText(/Early access/)).toBeInTheDocument();
    expect(section.getByText(/not listed in a plugin marketplace/)).toBeInTheDocument();
    expect(section.getByRole("link", { name: /mods types folder/ })).toHaveAttribute("href", MODS_TYPES_URL);
  });

  it("links the official plugin docs in a new tab", () => {
    render(<PublishPage />);
    for (const link of PLUGIN_DOCS_LINKS) {
      const anchor = screen.getByRole("link", { name: new RegExp(link.label) });
      expect(anchor).toHaveAttribute("href", link.url);
      expect(anchor).toHaveAttribute("target", "_blank");
    }
  });

  it("no longer contains the unverified publish API", () => {
    const { container } = render(<PublishPage />);
    expect(container.querySelector("#proposed-api")).toBeNull();
    expect(container.textContent).not.toMatch(/\/v1\/mods\/publish|Ed25519|Bearer|queued_for_security_scan/);
  });

  it("does not describe concepts or an unconfirmed runtime", () => {
    const { container } = render(<PublishPage />);
    expect(container.textContent).not.toMatch(/unconfirmed|could not confirm|concept/i);
  });

  it("exports metadata with a canonical path", () => {
    expect(metadata.alternates?.canonical).toBe("/publish/");
  });
});
