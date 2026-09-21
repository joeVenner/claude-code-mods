import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComparisonTable } from "./ComparisonTable";

const COLUMNS = ["Kind", "What it is", "What it does"] as const;
const ROWS = [
  { id: "mod", header: "Mod", cells: ["A plugin with a hooks module", "Hooks engine events"] },
  { id: "skill", header: "Skill", cells: ["A SKILL.md file", "Loads when relevant"] },
] as const;

describe("ComparisonTable", () => {
  it("is a table with a caption, column headers and a header for every row", () => {
    render(<ComparisonTable caption="Mods compared" columns={COLUMNS} rows={ROWS} />);
    const table = screen.getByRole("table", { name: "Mods compared" });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([...COLUMNS]);
    expect(within(table).getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual(["Mod", "Skill"]);
    expect(within(table).getAllByRole("cell")).toHaveLength(4);
  });

  it("puts each cell in its own row, in column order", () => {
    render(<ComparisonTable caption="Mods compared" columns={COLUMNS} rows={ROWS} />);
    const skillRow = screen.getByRole("rowheader", { name: "Skill" }).closest("tr") as HTMLElement;
    expect(within(skillRow).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["A SKILL.md file", "Loads when relevant"]);
  });

  it("can be focused and scrolled by keyboard inside its own named region", () => {
    render(<ComparisonTable caption="Mods compared" columns={COLUMNS} rows={ROWS} />);
    const region = screen.getByRole("region", { name: "Mods compared" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region.className).toContain("overflow-x-auto");
  });

  it("renders with no rows without failing", () => {
    render(<ComparisonTable caption="Empty" columns={COLUMNS} rows={[]} />);
    expect(within(screen.getByRole("table", { name: "Empty" })).queryAllByRole("cell")).toHaveLength(0);
  });
});
