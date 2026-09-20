import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyCommand } from "./CopyCommand";

const COMMAND = "/plugin install fixture-lint-runner";

// userEvent.setup() installs its own clipboard stub, so tests must call this after setup().
function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

describe("CopyCommand", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("shows the command with a decorative prompt and optional label", () => {
    render(<CopyCommand command={COMMAND} label="Install" />);
    expect(screen.getByText(COMMAND)).toBeInTheDocument();
    expect(screen.getByText("Install")).toBeInTheDocument();
    expect(screen.getByText("$")).toHaveAttribute("aria-hidden", "true");
  });

  it("copies the command and announces success", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    render(<CopyCommand command={COMMAND} />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(writeText).toHaveBeenCalledWith(COMMAND);
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
  });

  it("clears the success message after a short delay", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    render(<CopyCommand command={COMMAND} />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));
    expect(screen.getByRole("status")).toHaveTextContent("Copied");

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("shows a visible failure state when the clipboard rejects", async () => {
    const user = userEvent.setup();
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<CopyCommand command={COMMAND} />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(screen.getByRole("status")).toHaveTextContent("Copy failed, select the text");
    expect(console.warn).toHaveBeenCalled();
  });

  it("selects the command text on failure so it can be copied manually", async () => {
    const user = userEvent.setup();
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<CopyCommand command={COMMAND} />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(window.getSelection()?.toString()).toBe(COMMAND);
  });

  it("reports failure when the Clipboard API is unavailable", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    render(<CopyCommand command={COMMAND} />);

    await user.click(screen.getByRole("button", { name: "Copy command" }));

    expect(screen.getByRole("status")).toHaveTextContent("Copy failed, select the text");
  });
});
