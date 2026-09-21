import { describe, expect, it } from "vitest";
import { builtInModExtension, sourceOnlyExtension, verifiedExtension } from "@/components/catalog/__fixtures__/extensions";
import { getAllExtensions } from "@/lib/catalog";
import type { Extension } from "@/lib/types";
import { buildHooksIndex } from "./hooks-index";

function withHooks(extension: Extension, slug: string, name: string, hooks: readonly string[]): Extension {
  return { ...extension, slug, name, hooks: [...hooks] };
}

describe("buildHooksIndex", () => {
  it("returns empty groups for an empty catalog", () => {
    expect(buildHooksIndex([])).toEqual({ functionHooks: [], classicHooks: [] });
  });

  it("puts mod events in function hooks and every other kind in classic hooks", () => {
    const mod = withHooks(builtInModExtension, "mod-a", "mod-a", ["session.start"]);
    const plugin = withHooks(verifiedExtension, "plugin-a", "plugin-a", ["PostToolUse"]);
    const index = buildHooksIndex([mod, plugin]);
    expect(index.functionHooks.map((row) => row.event)).toEqual(["session.start"]);
    expect(index.classicHooks.map((row) => row.event)).toEqual(["PostToolUse"]);
  });

  it("lists every entry that uses an event, sorted by name, and events sorted alphabetically", () => {
    const zebra = withHooks(builtInModExtension, "zebra", "zebra", ["tool.call", "session.start"]);
    const apple = withHooks(builtInModExtension, "apple", "apple", ["session.start"]);
    const { functionHooks } = buildHooksIndex([zebra, apple]);
    expect(functionHooks.map((row) => row.event)).toEqual(["session.start", "tool.call"]);
    expect(functionHooks[0].entries.map((entry) => entry.slug)).toEqual(["apple", "zebra"]);
    expect(functionHooks[1].entries.map((entry) => entry.slug)).toEqual(["zebra"]);
  });

  it("orders entries with the same name by slug so the output never depends on input order", () => {
    const first = withHooks(builtInModExtension, "b-slug", "same", ["Stop"]);
    const second = withHooks(builtInModExtension, "a-slug", "same", ["Stop"]);
    const forward = buildHooksIndex([first, second]).functionHooks[0].entries.map((entry) => entry.slug);
    const backward = buildHooksIndex([second, first]).functionHooks[0].entries.map((entry) => entry.slug);
    expect(forward).toEqual(["a-slug", "b-slug"]);
    expect(backward).toEqual(forward);
  });

  it("counts an entry once when it repeats an event", () => {
    const repeated = withHooks(verifiedExtension, "repeat", "repeat", ["Stop", "Stop"]);
    expect(buildHooksIndex([repeated]).classicHooks[0].entries).toHaveLength(1);
  });

  it("keeps event names exactly as written, including wildcards and case", () => {
    const mod = withHooks(builtInModExtension, "wild", "wild", ["telemetry.*", "classic.*"]);
    expect(buildHooksIndex([mod]).functionHooks.map((row) => row.event)).toEqual(["classic.*", "telemetry.*"]);
  });

  it("carries the publisher kind so a page can label community listings", () => {
    const [row] = buildHooksIndex([withHooks(sourceOnlyExtension, "src", "src", ["Stop"])]).classicHooks;
    expect(row.entries[0]).toEqual({
      slug: "src",
      name: "src",
      kind: sourceOnlyExtension.kind,
      publisherKind: sourceOnlyExtension.publisher.kind,
    });
  });

  it("skips entries that list no hooks", () => {
    const silent = withHooks(verifiedExtension, "silent", "silent", []);
    expect(buildHooksIndex([silent])).toEqual({ functionHooks: [], classicHooks: [] });
  });

  it("does not mutate its input", () => {
    const extensions = getAllExtensions();
    const snapshot = JSON.stringify(extensions);
    buildHooksIndex(extensions);
    expect(JSON.stringify(extensions)).toBe(snapshot);
  });

  it("covers every hook the real catalog lists", () => {
    const extensions = getAllExtensions();
    const index = buildHooksIndex(extensions);
    const indexed = new Set([...index.functionHooks, ...index.classicHooks].map((row) => row.event));
    const listed = new Set(extensions.flatMap((extension) => extension.hooks));
    expect(indexed).toEqual(listed);
    expect(index.functionHooks.length).toBeGreaterThan(0);
    expect(index.classicHooks.length).toBeGreaterThan(0);
  });
});
