import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DefinitionList } from "./DefinitionList";

describe("DefinitionList", () => {
  it("pairs each term with its description inside a dl", () => {
    const { container } = render(
      <DefinitionList
        items={[
          { id: "a", term: "Alpha", description: <p>First letter</p> },
          { id: "b", term: "Beta", description: <p>Second letter</p> },
        ]}
      />,
    );
    expect(container.querySelector("dl")).not.toBeNull();
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["Alpha", "Beta"]);
    expect(screen.getAllByRole("definition").map((definition) => definition.textContent)).toEqual([
      "First letter",
      "Second letter",
    ]);
  });

  it("renders nothing inside the dl for an empty list", () => {
    const { container } = render(<DefinitionList items={[]} />);
    expect(container.querySelector("dl")?.children).toHaveLength(0);
  });
});
