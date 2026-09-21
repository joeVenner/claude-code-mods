import { describe, expect, it } from "vitest";
import { createQueryState, queryReducer } from "./queryState";
import type { QueryAction, QueryState } from "./queryState";

function run(initial: QueryState, actions: readonly QueryAction[]): QueryState {
  return actions.reduce(queryReducer, initial);
}

describe("queryReducer", () => {
  it("starts with the URL query everywhere", () => {
    expect(createQueryState("lint")).toEqual({
      input: "lint",
      applied: "lint",
      seenUrlQuery: "lint",
      inFlightQueries: [],
    });
  });

  it("updates only the raw input while typing", () => {
    const state = run(createQueryState(""), [{ type: "typed", value: "  li" }]);
    expect(state.input).toBe("  li");
    expect(state.applied).toBe("");
    expect(state.inFlightQueries).toEqual([]);
  });

  it("applies a committed query and remembers it as in flight", () => {
    const state = run(createQueryState(""), [{ type: "committed", query: "lint" }]);
    expect(state.applied).toBe("lint");
    expect(state.inFlightQueries).toEqual(["lint"]);
  });

  it("does not wait for an echo when the committed query equals the URL", () => {
    const state = run(createQueryState("lint"), [{ type: "committed", query: "lint" }]);
    expect(state.inFlightQueries).toEqual([]);
  });

  it("treats the URL echo of our own write as a no-op for the input", () => {
    const state = run(createQueryState(""), [
      { type: "typed", value: "lint" },
      { type: "committed", query: "lint" },
      { type: "typed", value: "lints" },
      { type: "urlChanged", urlQuery: "lint" },
    ]);
    expect(state.input).toBe("lints");
    expect(state.seenUrlQuery).toBe("lint");
    expect(state.inFlightQueries).toEqual([]);
  });

  it("survives a late intermediate echo without clobbering newer typing", () => {
    const state = run(createQueryState(""), [
      { type: "typed", value: "a" },
      { type: "committed", query: "a" },
      { type: "typed", value: "ab" },
      { type: "committed", query: "ab" },
      { type: "urlChanged", urlQuery: "a" },
    ]);
    expect(state.input).toBe("ab");
    expect(state.applied).toBe("ab");
    expect(state.inFlightQueries).toEqual(["ab"]);
  });

  it("drops superseded writes when a later echo arrives first", () => {
    const state = run(createQueryState(""), [
      { type: "committed", query: "a" },
      { type: "committed", query: "ab" },
      { type: "urlChanged", urlQuery: "ab" },
    ]);
    expect(state.inFlightQueries).toEqual([]);
    expect(state.seenUrlQuery).toBe("ab");
  });

  it("lets an outside navigation overwrite the input and results", () => {
    const state = run(createQueryState("lint"), [
      { type: "typed", value: "lint git" },
      { type: "urlChanged", urlQuery: "" },
    ]);
    expect(state).toEqual(createQueryState(""));
  });

  it("ignores a URL change to the query it has already seen", () => {
    const initial = createQueryState("lint");
    expect(queryReducer(initial, { type: "urlChanged", urlQuery: "lint" })).toBe(initial);
  });
});
