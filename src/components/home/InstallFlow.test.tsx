import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { HOME_FIXTURES, RUN_FROM_SOURCE_COMMAND, buildFeaturedMods, buildFixture } from "./__fixtures__/extensions";
import { InstallFlow } from "./InstallFlow";
import { pickInstallExamples, pickRunFromSource } from "./home-data";
import { stubIntersectionObserver } from "./__fixtures__/intersection-observer";

describe("InstallFlow", () => {
  beforeAll(stubIntersectionObserver);

  it("renders one copy row per real install command, grouped by listing", () => {
    const examples = HOME_FIXTURES.filter((extension) => extension.installCommands.length > 0);
    render(<InstallFlow examples={examples} />);

    for (const extension of examples) {
      const group = screen.getByRole("group", { name: `Install commands for ${extension.name}` });
      for (const command of extension.installCommands) {
        expect(within(group).getByText(command)).toBeInTheDocument();
      }
      expect(within(group).getByRole("link", { name: extension.name })).toBeInTheDocument();
    }
    const commandCount = examples.reduce((total, extension) => total + extension.installCommands.length, 0);
    expect(screen.getAllByRole("button", { name: "Copy command" })).toHaveLength(commandCount);
  });

  it("renders every command of a multi-command listing", () => {
    const multi = buildFixture({
      slug: "multi-command",
      name: "Multi Command",
      kind: "skill",
      installCommands: ["first command", "second command"],
    });
    render(<InstallFlow examples={[multi]} />);
    expect(screen.getByText("first command")).toBeInTheDocument();
    expect(screen.getByText("second command")).toBeInTheDocument();
  });

  it("states that listing does not mean reviewed", () => {
    render(<InstallFlow examples={[]} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Commands come from each listing");
    expect(screen.getByText(/does not mean the code was reviewed/)).toBeInTheDocument();
  });

  it("renders an honest fallback when no command exists", () => {
    render(<InstallFlow examples={[]} />);
    expect(screen.getByText("No copyable commands yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy command/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Read a mod running from source")).not.toBeInTheDocument();
  });
});

describe("InstallFlow install stack and mods", () => {
  beforeAll(stubIntersectionObserver);

  it("never lists a mod in the install stack when picked from a mixed catalog", () => {
    const catalog = [...buildFeaturedMods(4), ...HOME_FIXTURES];
    const examples = pickInstallExamples(catalog);
    render(<InstallFlow examples={examples} />);

    expect(examples.length).toBeGreaterThan(0);
    for (const group of screen.getAllByRole("group")) {
      expect(group).not.toHaveAccessibleName(/mod-/);
    }
    for (const mod of buildFeaturedMods(4)) {
      expect(screen.queryByRole("group", { name: `Install commands for ${mod.name}` })).not.toBeInTheDocument();
    }
  });
});

describe("InstallFlow run from source", () => {
  beforeAll(stubIntersectionObserver);

  const mods = buildFeaturedMods(3);
  const runFromSource = pickRunFromSource(mods);

  it("shows a labelled block with the exact stored command and one plain prerequisite sentence", () => {
    render(<InstallFlow examples={[]} runFromSource={runFromSource} />);
    const block = screen.getByRole("group", { name: "Read a mod running from source" });

    expect(within(block).getByRole("heading", { level: 3 })).toBeInTheDocument();
    expect(within(block).getByText(RUN_FROM_SOURCE_COMMAND)).toBeInTheDocument();
    expect(
      within(block).getByText("Needs a clone of fixture-vendor/fixture-repo. Early access."),
    ).toBeInTheDocument();
    expect(within(block).getByRole("button", { name: "Copy command: Run mod-one from source" })).toBeInTheDocument();
    expect(within(block).getByRole("link", { name: "mod-one" }).getAttribute("href")).toMatch(/^\/extensions\/mod-one\/?$/);
    expect(screen.queryByText("No copyable commands yet")).not.toBeInTheDocument();
  });

  it("names the source repository generically when the URL is not on GitHub", () => {
    const offGitHub = buildFixture({
      slug: "elsewhere",
      name: "Elsewhere",
      kind: "mod",
      repositoryUrl: "https://code.claude.com/docs/en/mods",
      details: [{ label: "Run from source", value: "claude --plugin-dir mods/elsewhere", isCommand: true }],
    });
    render(<InstallFlow examples={[]} runFromSource={pickRunFromSource([offGitHub])} />);
    expect(screen.getByText("Needs a clone of the source repository. Early access.")).toBeInTheDocument();
  });

  it("takes the caveat from the entry's own notice and adds none without one", () => {
    const withOwnNotice = buildFixture({
      slug: "own-notice",
      name: "Own Notice",
      kind: "mod",
      notice: "Preview build. Other words.",
      details: [{ label: "Run from source", value: "claude --plugin-dir mods/own-notice", isCommand: true }],
    });
    const { unmount } = render(<InstallFlow examples={[]} runFromSource={pickRunFromSource([withOwnNotice])} />);
    expect(screen.getByText("Needs a clone of fixture-org/own-notice. Preview build.")).toBeInTheDocument();
    unmount();

    const withoutNotice = { ...withOwnNotice, notice: null };
    render(<InstallFlow examples={[]} runFromSource={pickRunFromSource([withoutNotice])} />);
    expect(screen.getByText("Needs a clone of fixture-org/own-notice.")).toBeInTheDocument();
    expect(screen.queryByText(/early access/i)).not.toBeInTheDocument();
  });

  it("appears alongside install groups when both exist", () => {
    const [installable] = HOME_FIXTURES;
    render(<InstallFlow examples={[installable]} runFromSource={runFromSource} />);
    expect(screen.getByRole("group", { name: `Install commands for ${installable.name}` })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Read a mod running from source" })).toBeInTheDocument();
  });

  it("is absent when no mod has a Run from source command", () => {
    render(<InstallFlow examples={[HOME_FIXTURES[0]]} runFromSource={pickRunFromSource(buildFeaturedMods(2).slice(1))} />);
    expect(screen.queryByText("Read a mod running from source")).not.toBeInTheDocument();
  });

  it("contains no dashes", () => {
    const { container } = render(<InstallFlow examples={[HOME_FIXTURES[0]]} runFromSource={runFromSource} />);
    expect(container.textContent).not.toMatch(/[–—]/);
  });
});
