import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchField } from "./SearchField";

function Harness({ onChange }: { readonly onChange?: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <SearchField
      id="q"
      label="Search extensions"
      hint="Matches names and tags."
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("SearchField", () => {
  it("associates a visible label with the input", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Search extensions");
    expect(input).toHaveAttribute("id", "q");
    expect(screen.getByText("Search extensions").tagName).toBe("LABEL");
  });

  it("links the hint through aria-describedby", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Search extensions")).toHaveAccessibleDescription("Matches names and tags.");
  });

  it("reports typed values through onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.type(screen.getByLabelText("Search extensions"), "lint");

    expect(onChange).toHaveBeenLastCalledWith("lint");
    expect(screen.getByLabelText("Search extensions")).toHaveValue("lint");
  });

  it("hides the clear button when empty and clears and refocuses when used", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Search extensions"), "abc");
    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(onChange).toHaveBeenLastCalledWith("");
    expect(screen.getByLabelText("Search extensions")).toHaveValue("");
    expect(screen.getByLabelText("Search extensions")).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear search" })).not.toBeInTheDocument();
  });
});
