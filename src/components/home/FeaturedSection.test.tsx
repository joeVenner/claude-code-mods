import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { HOME_FIXTURES, buildFeaturedMods, buildFixture } from "./__fixtures__/extensions";
import { FeaturedSection } from "./FeaturedSection";
import { stubIntersectionObserver } from "./__fixtures__/intersection-observer";

describe("FeaturedSection", () => {
  beforeAll(stubIntersectionObserver);

  it.each([3, 4, 5])("renders exactly one row per entry for %i featured mods", (count) => {
    const mods = buildFeaturedMods(count);
    render(<FeaturedSection extensions={mods} />);

    expect(screen.getAllByRole("article")).toHaveLength(count);
    expect(screen.getAllByRole("listitem").filter((item) => item.closest("ul")?.className.includes("divide-y"))).toHaveLength(
      count,
    );
    for (const mod of mods) {
      expect(screen.getByRole("link", { name: mod.name })).toBeInTheDocument();
    }
  });

  it("titles a set of built-in mods honestly and keeps featured as an editorial choice", () => {
    render(<FeaturedSection extensions={buildFeaturedMods(4)} />);
    expect(screen.getByRole("heading", { level: 2, name: "Mods that ship inside Claude Code" })).toBeInTheDocument();
    expect(screen.getByText(/editorial choice, not a security review/)).toBeInTheDocument();
  });

  it("shows the built-in chip and the hook count with the first events in mono", () => {
    const [first] = buildFeaturedMods(3);
    render(<FeaturedSection extensions={buildFeaturedMods(3)} />);
    const row = screen.getByRole("link", { name: first.name }).closest("article") as HTMLElement;

    expect(within(row).getByText("Built in")).toBeInTheDocument();
    expect(within(row).getByText("5 hooks")).toBeInTheDocument();
    const events = within(within(row).getByRole("list", { name: "First hooks" })).getAllByRole("listitem");
    expect(events.map((event) => event.textContent)).toEqual(["classic.*", "prompt.section", "prompt.context", "+2 more"]);
    expect(within(row).getByText("classic.*")).toBeInTheDocument();
  });

  it("uses the singular for one hook and no overflow line when everything fits", () => {
    const mods = buildFeaturedMods(3);
    render(<FeaturedSection extensions={mods} />);
    const row = screen.getByRole("link", { name: "mod-three" }).closest("article") as HTMLElement;
    expect(within(row).getByText("1 hook")).toBeInTheDocument();
    expect(within(row).queryByText(/more$/)).not.toBeInTheDocument();
  });

  it("falls back to a generic heading for entries that are not built-in mods", () => {
    const plugin = HOME_FIXTURES[0];
    render(<FeaturedSection extensions={[plugin, HOME_FIXTURES[1]]} />);
    expect(screen.getByRole("heading", { level: 2, name: "Featured entries" })).toBeInTheDocument();
    expect(screen.getAllByText("Installable")).toHaveLength(2);
    expect(screen.queryByText("Built in")).not.toBeInTheDocument();
  });

  it("says Most starred, shows stars and never claims a hand-picked choice when nothing is featured", () => {
    const starred = [
      buildFixture({ slug: "star-one", name: "Star One", kind: "plugin", stars: 900, hooks: ["PreToolUse"] }),
      buildFixture({ slug: "star-two", name: "Star Two", kind: "skill", stars: 12 }),
    ];
    const { container } = render(<FeaturedSection extensions={starred} isEditorialPick={false} />);
    expect(screen.getByRole("heading", { level: 2, name: "Most starred" })).toBeInTheDocument();
    expect(screen.queryByText(/hand-picked|editorial choice/i)).not.toBeInTheDocument();
    expect(screen.getByText("900 stars")).toBeInTheDocument();
    expect(screen.getByText("12 stars")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/[\u2013\u2014]/);
  });

  it("does not use the built-in mods heading for a community mod", () => {
    const community = buildFixture({
      slug: "community-mod",
      name: "community-mod",
      kind: "mod",
      publisherKind: "community",
      availability: "source-only",
    });
    render(<FeaturedSection extensions={[community]} />);
    expect(screen.getByRole("heading", { level: 2, name: "Featured entries" })).toBeInTheDocument();
    expect(screen.queryByText(/ship inside Claude Code/)).not.toBeInTheDocument();
  });

  it("renders one row for a single featured entry", () => {
    render(<FeaturedSection extensions={buildFeaturedMods(1)} />);
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("links each row to its detail page and never mentions concepts or dashes", () => {
    const { container } = render(<FeaturedSection extensions={buildFeaturedMods(4)} />);
    expect(screen.getByRole("link", { name: "mod-one" }).getAttribute("href")).toMatch(/^\/extensions\/mod-one\/?$/);
    expect(container.textContent).not.toMatch(/concept/i);
    expect(container.textContent).not.toMatch(/[–—]/);
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<FeaturedSection extensions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
