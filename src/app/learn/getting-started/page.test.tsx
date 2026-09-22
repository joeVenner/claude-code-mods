import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { FUNCTION_HOOKS_FLAG, LEARN_SOURCES, RUN_WARNING, STARTER_LIMITS, TESTED_WITH } from "@/components/docs/learnContent";
import { PAGE_SEO } from "@/lib/seo/pages";
import { COMMUNITY_REPOSITORY_URL, SITE_URL } from "@/lib/site";
import { STARTER_MOD_DIRECTORY, STARTER_MOD_FILES, loadStarterModFiles } from "@/lib/starter-mod";
import GettingStartedPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("getting started page", () => {
  it("has exactly one h1, ordered headings and no em or en dashes", () => {
    const { container } = render(<GettingStartedPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName.slice(1)));
    levels.slice(1).forEach((level, index) => {
      expect(level - levels[index]).toBeLessThanOrEqual(1);
    });
  });

  it("warns first that this is early access and says which Claude Code version the commands were run on", () => {
    render(<GettingStartedPage />);
    const warning = screen.getAllByRole("note").find((note) => note.getAttribute("data-tone") === "warning");
    expect(warning).toHaveTextContent(/early access/);
    expect(warning).toHaveTextContent(`Claude Code ${TESTED_WITH.claudeCodeVersion}`);
    expect(warning).toHaveTextContent(TESTED_WITH.date);
  });

  it("gives the enable command and says the flag comes from the issue update, not documentation", () => {
    const { container } = render(<GettingStartedPage />);
    const element = container.querySelector("#enable") as HTMLElement;
    const section = within(element);
    expect(section.getByText(`${FUNCTION_HOOKS_FLAG} claude`)).toBeInTheDocument();
    expect(section.getByText(/Sep 9 update of the/)).toBeInTheDocument();
    expect(section.getByText(/not in documentation/)).toBeInTheDocument();
    expect(element.textContent).not.toMatch(/in a comment/);
    expect(section.getByRole("link", { name: /announcement issue/ })).toHaveAttribute("href", LEARN_SOURCES.announcementIssue);
  });

  it("says test needs the flag while validate does not, as run on the tested version", () => {
    const { container } = render(<GettingStartedPage />);
    const text = (container.querySelector("#enable") as HTMLElement).textContent ?? "";
    expect(text).toMatch(/claude plugin test.*does not exist until the variable is set/);
    expect(text).toMatch(/claude plugin validate.*works either way/);
  });

  it("shows every starter file, exactly as it is on disk, under its own name", () => {
    const { container } = render(<GettingStartedPage />);
    const section = container.querySelector("#starter") as HTMLElement;
    for (const file of loadStarterModFiles()) {
      const block = within(section).getByRole("group", { name: `Contents of ${file.path}` });
      expect(block.textContent, file.path).toBe(file.content);
    }
    expect(within(section).getAllByRole("figure")).toHaveLength(STARTER_MOD_FILES.length);
  });

  it("links the starter folder in the community repository", () => {
    const { container } = render(<GettingStartedPage />);
    const link = within(container.querySelector("#starter") as HTMLElement).getByRole("link", { name: new RegExp(STARTER_MOD_DIRECTORY) });
    expect(link).toHaveAttribute("href", `${COMMUNITY_REPOSITORY_URL}/tree/main/${STARTER_MOD_DIRECTORY}`);
  });

  it("states what the starter does and does not catch, in its own callout", () => {
    const { container } = render(<GettingStartedPage />);
    const callout = within(container.querySelector("#starter") as HTMLElement).getByRole("note");
    expect(callout).toHaveTextContent(STARTER_LIMITS);
    expect(callout).toHaveTextContent(/teaching example, not a security boundary/);
    expect(callout).toHaveTextContent(/sudo/);
    expect(callout).toHaveTextContent(/Do not rely on it/);
  });

  it("starts from a clone of the repository, so the relative paths in the commands resolve", () => {
    const { container } = render(<GettingStartedPage />);
    const section = within(container.querySelector("#starter") as HTMLElement);
    expect(section.getByText(`git clone ${COMMUNITY_REPOSITORY_URL}.git`)).toBeInTheDocument();
    expect(section.getByText("cd claude-code-mods")).toBeInTheDocument();
  });

  it("warns, before the first command that runs the mod, that running a mod executes its code", () => {
    const { container } = render(<GettingStartedPage />);
    const section = container.querySelector("#test") as HTMLElement;
    const warning = within(section).getByRole("note");
    expect(warning).toHaveAttribute("data-tone", "warning");
    for (const paragraph of RUN_WARNING) expect(warning).toHaveTextContent(paragraph);
    expect(warning).toHaveTextContent(/runs its code with your permissions/);
    // The warning comes before the command, in document order.
    const command = within(section).getByText(new RegExp(`claude plugin test ${STARTER_MOD_DIRECTORY}`));
    expect(warning.compareDocumentPosition(command) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("scopes the flag to each command and never tells the reader to export it", () => {
    const { container } = render(<GettingStartedPage />);
    expect(container.textContent).not.toMatch(/export CLAUDE_CODE_ENABLE_FUNCTION_HOOKS/);
    expect(screen.getByText(`${FUNCTION_HOOKS_FLAG} claude plugin test ${STARTER_MOD_DIRECTORY}`)).toBeInTheDocument();
  });

  it("gives copyable test, validate and run commands for the starter folder", () => {
    render(<GettingStartedPage />);
    for (const command of [
      `${FUNCTION_HOOKS_FLAG} claude plugin test ${STARTER_MOD_DIRECTORY}`,
      `claude plugin validate ${STARTER_MOD_DIRECTORY}`,
      `${FUNCTION_HOOKS_FLAG} claude --plugin-dir ${STARTER_MOD_DIRECTORY}`,
    ]) {
      expect(screen.getByText(command)).toBeInTheDocument();
    }
  });

  it("does not say the tested files are guaranteed to be the ones shown", () => {
    const { container } = render(<GettingStartedPage />);
    expect(container.textContent).not.toMatch(/so they are the files that were tested/);
    expect(container.textContent).toMatch(/in this site.s repository when the site is built/);
  });

  it("does not claim the starter was run in a live session", () => {
    const { container } = render(<GettingStartedPage />);
    expect(container.textContent).toMatch(/was not run in a live session/);
  });

  it("names the environment limits and the test kit notes", () => {
    render(<GettingStartedPage />);
    expect(screen.getByText(/no DOM and no Node/)).toBeInTheDocument();
    expect(screen.getByText(/no test\.each/)).toBeInTheDocument();
  });

  it("links on to the migration guide", () => {
    render(<GettingStartedPage />);
    const link = screen.getByRole("link", { name: "classic hooks to function hooks" });
    expect(link.getAttribute("href")).toMatch(/^\/learn\/migration\/?$/);
  });

  it("has its own canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${PAGE_SEO.learnGettingStarted.path}`);
  });

  it("embeds one parseable JSON-LD graph with Learn as the parent step", () => {
    const { container } = render(<GettingStartedPage />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    const graph = JSON.parse(scripts[0].textContent ?? "") as { "@graph": { "@type": string; itemListElement?: { name: string }[] }[] };
    const crumbs = graph["@graph"].find((node) => node["@type"] === "BreadcrumbList")?.itemListElement ?? [];
    expect(crumbs.map((crumb) => crumb.name)).toEqual(["Home", "Learn", "Getting started"]);
  });
});
