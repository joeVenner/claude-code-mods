import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChoiceOption } from "./ChoiceOption";

const baseProps = { name: "kind", layout: "chip", onSelect: vi.fn() } as const;

describe("ChoiceOption", () => {
  it("disables an unselected option that would return no results", () => {
    render(<ChoiceOption {...baseProps} value="skill" label="Skill" count={0} isChecked={false} />);
    expect(screen.getByRole("radio", { name: /Skill/ })).toBeDisabled();
  });

  it("keeps the current selection enabled at zero results so it can be changed", () => {
    render(<ChoiceOption {...baseProps} value="plugin" label="Plugin" count={0} isChecked />);
    expect(screen.getByRole("radio", { name: /Plugin/ })).toBeEnabled();
  });

  it("keeps the All option enabled at zero results so a filter can always be cleared", () => {
    render(<ChoiceOption {...baseProps} value="" label="All kinds" count={0} isChecked={false} isAlwaysEnabled />);
    expect(screen.getByRole("radio", { name: /All kinds/ })).toBeEnabled();
  });

  it("reports the value when selected", () => {
    const onSelect = vi.fn();
    render(<ChoiceOption {...baseProps} onSelect={onSelect} value="hook" label="Hook" count={3} isChecked={false} />);
    screen.getByRole("radio", { name: /Hook/ }).click();
    expect(onSelect).toHaveBeenCalledWith("hook");
  });
});
