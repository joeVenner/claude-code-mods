import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { buildFeaturedMods, buildFixture } from "./__fixtures__/extensions";
import { TrustModel } from "./TrustModel";
import { selectBuiltInMods } from "./home-data";
import { stubIntersectionObserver } from "./__fixtures__/intersection-observer";

const MODS = selectBuiltInMods(buildFeaturedMods(3));

describe("TrustModel", () => {
  beforeAll(stubIntersectionObserver);

  it("shows the three states in order with the catalog date on the verified one", () => {
    render(<TrustModel catalogDate="2026-01-02" builtInMods={MODS} />);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["Source verified", "Built in", "Not scanned yet"]);
    const dateElement = screen.getByText("2026-01-02");
    expect(dateElement.tagName).toBe("TIME");
    expect(dateElement).toHaveAttribute("datetime", "2026-01-02");
  });

  it("takes the Built in caveat from the entries' own notices", () => {
    render(<TrustModel catalogDate="2026-01-02" builtInMods={MODS} />);
    const body = screen.getByText(/Ships inside Claude Code/);
    expect(body).toHaveTextContent("Ships inside Claude Code, with its source published for reading. Early access. Fixture caveat sentence.");
  });

  it("keeps only the definition when the notices differ", () => {
    const mods = [
      buildFixture({ slug: "one", name: "one", kind: "mod", notice: "Early access. A." }),
      buildFixture({ slug: "two", name: "two", kind: "mod", notice: "Preview. B." }),
    ];
    render(<TrustModel catalogDate="2026-01-02" builtInMods={mods} />);
    expect(screen.getByText("Ships inside Claude Code, with its source published for reading.")).toBeInTheDocument();
  });

  it("drops the Built in column when nothing in the catalog is built in", () => {
    render(<TrustModel catalogDate="2026-01-02" />);
    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["Source verified", "Not scanned yet"]);
    expect(screen.queryByText(/Ships inside Claude Code/)).not.toBeInTheDocument();
  });

  it("no longer mentions concepts", () => {
    const { container } = render(<TrustModel catalogDate="2026-01-02" builtInMods={MODS} />);
    expect(container.textContent ?? "").not.toMatch(/concept/i);
    expect(screen.queryByRole("heading", { name: "Concept" })).not.toBeInTheDocument();
  });

  it("says scanning is specified but not built and never claims a scan", () => {
    render(<TrustModel catalogDate="2026-01-02" builtInMods={MODS} />);
    expect(screen.getByText(/specified but not built/)).toBeInTheDocument();
    expect(screen.getByText(/does not show the code is safe/)).toBeInTheDocument();
  });

  it("has one security link and one publish link, each with a single label", () => {
    render(<TrustModel catalogDate="2026-01-02" builtInMods={MODS} />);
    const security = screen.getAllByRole("link", { name: "Read the security model" });
    expect(security).toHaveLength(1);
    expect(security[0].getAttribute("href")).toContain("/security");
    const publish = screen.getAllByRole("link", { name: "Publish an extension" });
    expect(publish).toHaveLength(1);
    expect(publish[0].getAttribute("href")).toContain("/publish");
  });
});
