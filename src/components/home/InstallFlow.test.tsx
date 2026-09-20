import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { HOME_FIXTURES, buildFixture } from "./__fixtures__/extensions";
import { InstallFlow } from "./InstallFlow";
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
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Install commands come from each listing");
    expect(screen.getByText(/does not mean the code was reviewed/)).toBeInTheDocument();
  });

  it("renders an honest fallback when no command exists", () => {
    render(<InstallFlow examples={[]} />);
    expect(screen.getByText("No copyable commands yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copy command/ })).not.toBeInTheDocument();
  });
});
