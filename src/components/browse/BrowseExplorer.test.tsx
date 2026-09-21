import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowseExplorer, QUERY_DEBOUNCE_MS } from "./BrowseExplorer";
import { browseFixtures, docsBridge, lintRunner, paneMod, policyMod, sourceSkill } from "./__fixtures__/browseItems";

/**
 * A minimal stand-in for the App Router: `replace` updates the search string and notifies
 * `useSearchParams`, so the URL really is the source of truth in these tests.
 */
const routerStore = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const store = {
    search: "",
    replace: vi.fn(),
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setSearch(next: string): void {
      store.search = next;
      listeners.forEach((listener) => listener());
    },
  };
  return store;
});

vi.mock("next/navigation", async () => {
  const react = await import("react");
  return {
    useRouter: () => ({ replace: routerStore.replace }),
    useSearchParams: () => {
      const search = react.useSyncExternalStore(
        routerStore.subscribe,
        () => routerStore.search,
        () => routerStore.search,
      );
      return new URLSearchParams(search);
    },
  };
});

function renderExplorer(initialSearch = ""): RenderResult {
  routerStore.search = initialSearch;
  return render(<BrowseExplorer extensions={browseFixtures} />);
}

function resultNames(): readonly string[] {
  return screen.queryAllByRole("heading", { level: 3 }).map((heading) => heading.textContent ?? "");
}

function lastReplaceUrl(): string {
  const calls = routerStore.replace.mock.calls;
  return calls[calls.length - 1]?.[0] as string;
}

beforeEach(() => {
  routerStore.search = "";
  routerStore.replace.mockReset();
  routerStore.replace.mockImplementation((url: string) => {
    const queryStart = url.indexOf("?");
    routerStore.setSearch(queryStart === -1 ? "" : url.slice(queryStart + 1));
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BrowseExplorer initial state", () => {
  it("shows the whole catalog and a count for the defaults", () => {
    renderExplorer();
    expect(resultNames()).toHaveLength(browseFixtures.length);
    expect(screen.getByText(`${browseFixtures.length} extensions`)).toBeInTheDocument();
    expect(screen.getByLabelText("Search extensions")).toHaveValue("");
    expect(screen.getByLabelText("Sort by")).toHaveValue("featured");
  });

  it("reads query, kind and sort from the URL", () => {
    renderExplorer("q=lint&kind=plugin&sort=name");
    expect(screen.getByLabelText("Search extensions")).toHaveValue("lint");
    expect(screen.getByRole("radio", { name: /^Plugin/ })).toBeChecked();
    expect(screen.getByLabelText("Sort by")).toHaveValue("name");
    expect(resultNames()).toEqual([lintRunner.name]);
    expect(screen.getByText("1 extension")).toBeInTheDocument();
  });

  it("ignores invalid URL values", () => {
    renderExplorer("kind=widget&availability=maybe&status=concept&sort=random&category=nope");
    expect(resultNames()).toHaveLength(browseFixtures.length);
    expect(screen.getByRole("radio", { name: /^All kinds/ })).toBeChecked();
    expect(screen.getByLabelText("Sort by")).toHaveValue("featured");
  });

  it("renders a single search field with a visible label and the slash hint", () => {
    renderExplorer();
    expect(screen.getByText("Search extensions").tagName).toBe("LABEL");
    expect(screen.getByLabelText("Search extensions")).toHaveAccessibleDescription(/Press \/ to jump here/);
  });
});

describe("BrowseExplorer search", () => {
  it("keeps the input instant and writes the URL after the debounce", () => {
    vi.useFakeTimers();
    renderExplorer();
    const input = screen.getByLabelText("Search extensions");

    fireEvent.change(input, { target: { value: "lint" } });
    expect(input).toHaveValue("lint");
    expect(routerStore.replace).not.toHaveBeenCalled();
    expect(resultNames()).toHaveLength(browseFixtures.length);

    act(() => {
      vi.advanceTimersByTime(QUERY_DEBOUNCE_MS - 1);
    });
    expect(routerStore.replace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(routerStore.replace).toHaveBeenCalledTimes(1);
    expect(routerStore.replace).toHaveBeenCalledWith("/browse/?q=lint", { scroll: false });
    expect(resultNames()).toEqual([lintRunner.name, docsBridge.name]);
  });

  it("collapses rapid keystrokes into one write", () => {
    vi.useFakeTimers();
    renderExplorer();
    const input = screen.getByLabelText("Search extensions");

    for (const value of ["l", "li", "lin", "lint"]) {
      fireEvent.change(input, { target: { value } });
      act(() => {
        vi.advanceTimersByTime(QUERY_DEBOUNCE_MS / 2);
      });
    }
    expect(routerStore.replace).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(QUERY_DEBOUNCE_MS);
    });
    expect(routerStore.replace).toHaveBeenCalledTimes(1);
    expect(lastReplaceUrl()).toBe("/browse/?q=lint");
  });

  it("does not overwrite newer typing when the URL echoes an older write", () => {
    vi.useFakeTimers();
    renderExplorer();
    const input = screen.getByLabelText("Search extensions");
    // Hold navigation so the echo arrives after more typing, like a slow router.
    routerStore.replace.mockImplementation(() => undefined);

    fireEvent.change(input, { target: { value: "lint" } });
    act(() => {
      vi.advanceTimersByTime(QUERY_DEBOUNCE_MS);
    });
    fireEvent.change(input, { target: { value: "lint r" } });
    act(() => {
      routerStore.setSearch("q=lint");
    });
    expect(input).toHaveValue("lint r");
  });

  it("follows an outside navigation that changes the query", () => {
    renderExplorer("q=lint");
    const input = screen.getByLabelText("Search extensions");
    expect(input).toHaveValue("lint");
    act(() => {
      routerStore.setSearch("");
    });
    expect(input).toHaveValue("");
    expect(resultNames()).toHaveLength(browseFixtures.length);
  });

  it("clears the query from the field's clear button", () => {
    vi.useFakeTimers();
    renderExplorer("q=lint");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    act(() => {
      vi.advanceTimersByTime(QUERY_DEBOUNCE_MS);
    });
    expect(lastReplaceUrl()).toBe("/browse/");
  });

  it("clears pending timers on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = renderExplorer();
    fireEvent.change(screen.getByLabelText("Search extensions"), { target: { value: "x" } });
    unmount();
    act(() => {
      vi.advanceTimersByTime(QUERY_DEBOUNCE_MS * 2);
    });
    expect(routerStore.replace).not.toHaveBeenCalled();
  });
});

describe("BrowseExplorer facets", () => {
  it("selecting a kind writes the URL immediately and filters the results", async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.click(screen.getByRole("radio", { name: /^Mod/ }));
    expect(routerStore.replace).toHaveBeenCalledWith("/browse/?kind=mod", { scroll: false });
    expect(resultNames()).toEqual([paneMod.name, policyMod.name]);
    expect(screen.getByRole("radio", { name: /^Mod/ })).toBeChecked();
  });

  it("folds a pending text query into a facet write", async () => {
    const user = userEvent.setup();
    renderExplorer();
    fireEvent.change(screen.getByLabelText("Search extensions"), { target: { value: "lint" } });
    await user.click(screen.getByRole("radio", { name: /^Plugin/ }));
    expect(lastReplaceUrl()).toBe("/browse/?q=lint&kind=plugin");
  });

  it("computes kind counts from the other active filters", () => {
    renderExplorer("availability=built-in");
    expect(screen.getByRole("radio", { name: "Mod 2" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "Plugin 0" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "All kinds 2" })).toBeChecked();
  });

  it("keeps a selected zero-count option enabled so it can be undone", () => {
    renderExplorer("kind=plugin&availability=built-in");
    expect(screen.getByRole("radio", { name: "Plugin 0" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Plugin 0" })).toBeEnabled();
  });

  it("selects a category and an availability", async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.click(screen.getByRole("radio", { name: /^Security/ }));
    await user.click(screen.getByRole("radio", { name: /^Built in/ }));
    expect(lastReplaceUrl()).toBe("/browse/?category=security&availability=built-in");
    expect(resultNames()).toEqual([policyMod.name]);
  });

  it("offers an availability group with a count for each label", () => {
    renderExplorer();
    const group = screen.getByRole("group", { name: "Availability" });
    expect(within(group).getByRole("radio", { name: "Any availability 7" })).toBeChecked();
    expect(within(group).getByRole("radio", { name: "Installable 4" })).toBeEnabled();
    expect(within(group).getByRole("radio", { name: "Built in 2" })).toBeEnabled();
    expect(within(group).getByRole("radio", { name: "Source only 1" })).toBeEnabled();
  });

  it("reads the availability facet from the URL and narrows the results", () => {
    renderExplorer("availability=source-only");
    expect(screen.getByRole("radio", { name: /^Source only/ })).toBeChecked();
    expect(resultNames()).toEqual([sourceSkill.name]);
  });

  it("clears the availability facet with the Any option", async () => {
    const user = userEvent.setup();
    renderExplorer("availability=built-in");
    await user.click(screen.getByRole("radio", { name: /^Any availability/ }));
    expect(lastReplaceUrl()).toBe("/browse/");
    expect(resultNames()).toHaveLength(browseFixtures.length);
  });

  it("ignores a legacy status link", () => {
    renderExplorer("status=concept");
    expect(resultNames()).toHaveLength(browseFixtures.length);
    expect(screen.getByRole("radio", { name: /^Any availability/ })).toBeChecked();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("changes the sort through the labelled select", async () => {
    const user = userEvent.setup();
    renderExplorer();
    await user.selectOptions(screen.getByLabelText("Sort by"), "stars");
    expect(lastReplaceUrl()).toBe("/browse/?sort=stars");
    expect(resultNames()[resultNames().length - 1]).toBe(sourceSkill.name);
  });

  it("labels the default sort Best match while searching", () => {
    renderExplorer("q=lint");
    expect(within(screen.getByLabelText("Sort by")).getByRole("option", { name: "Best match" })).toBeInTheDocument();
  });
});

describe("BrowseExplorer clear filters", () => {
  it("is absent when nothing is active", () => {
    renderExplorer();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("resets query and facets, keeps the sort, and updates the URL", async () => {
    const user = userEvent.setup();
    renderExplorer("q=lint&kind=plugin&sort=name");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(lastReplaceUrl()).toBe("/browse/?sort=name");
    expect(screen.getByLabelText("Search extensions")).toHaveValue("");
    expect(screen.getByRole("radio", { name: /^All kinds/ })).toBeChecked();
    expect(resultNames()).toHaveLength(browseFixtures.length);
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });
});

describe("BrowseExplorer empty state", () => {
  it("shows an empty state with a working clear action", async () => {
    const user = userEvent.setup();
    renderExplorer("q=zzz-no-match");
    expect(screen.getByText("No extensions match")).toBeInTheDocument();
    expect(screen.getByText("0 extensions")).toBeInTheDocument();
    expect(resultNames()).toEqual([]);

    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    await user.click(clearButtons[clearButtons.length - 1]!);
    expect(screen.queryByText("No extensions match")).not.toBeInTheDocument();
    expect(resultNames()).toHaveLength(browseFixtures.length);
  });
});

describe("BrowseExplorer live region", () => {
  it("announces the result count politely and updates it", async () => {
    const user = userEvent.setup();
    renderExplorer();
    const liveRegion = screen.getByText(`${browseFixtures.length} extensions`);
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    await user.click(screen.getByRole("radio", { name: /^Mod/ }));
    expect(liveRegion).toHaveTextContent("2 extensions");
  });
});

describe("BrowseExplorer copy", () => {
  it("never mentions concepts", () => {
    const { container } = renderExplorer();
    expect(container.textContent ?? "").not.toMatch(/concept/i);
  });
});

describe("BrowseExplorer slash shortcut", () => {
  it("focuses the search field on slash", () => {
    renderExplorer();
    fireEvent.keyDown(document.body, { key: "/" });
    expect(screen.getByLabelText("Search extensions")).toHaveFocus();
  });

  it("prevents the slash from being typed into the field", () => {
    renderExplorer();
    const notPrevented = fireEvent.keyDown(document.body, { key: "/" });
    expect(notPrevented).toBe(false);
  });

  it("does not steal slash while typing in another text field", () => {
    renderExplorer();
    const other = document.createElement("input");
    other.type = "text";
    document.body.appendChild(other);
    other.focus();
    const notPrevented = fireEvent.keyDown(other, { key: "/" });
    expect(notPrevented).toBe(true);
    expect(other).toHaveFocus();
    other.remove();
  });

  it("does not steal slash from the sort select", () => {
    renderExplorer();
    const select = screen.getByLabelText("Sort by");
    select.focus();
    fireEvent.keyDown(select, { key: "/" });
    expect(select).toHaveFocus();
  });

  it("ignores slash with a modifier key", () => {
    renderExplorer();
    fireEvent.keyDown(document.body, { key: "/", ctrlKey: true });
    expect(screen.getByLabelText("Search extensions")).not.toHaveFocus();
  });

  it("ignores other keys", () => {
    renderExplorer();
    fireEvent.keyDown(document.body, { key: "a" });
    expect(screen.getByLabelText("Search extensions")).not.toHaveFocus();
  });

  it("removes its listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderExplorer();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe("BrowseExplorer mobile filters disclosure", () => {
  it("starts collapsed and toggles aria-expanded", async () => {
    const user = userEvent.setup();
    renderExplorer();
    const toggle = screen.getByRole("button", { name: "Filters" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("controls the panel that holds the filter groups", () => {
    renderExplorer();
    const toggle = screen.getByRole("button", { name: "Filters" });
    const panelId = toggle.getAttribute("aria-controls") ?? "";
    const panel = document.getElementById(panelId);
    expect(panel).not.toBeNull();
    expect(within(panel as HTMLElement).getByRole("group", { name: "Kind" })).toBeInTheDocument();
  });

  it("shows the number of active facet filters in the button name", () => {
    renderExplorer("kind=hook&availability=installable&q=git");
    expect(screen.getByRole("button", { name: "Filters, 2 active" })).toBeInTheDocument();
  });
});
