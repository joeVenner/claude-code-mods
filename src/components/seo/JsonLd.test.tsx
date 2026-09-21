import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { verifiedExtension } from "@/components/catalog/__fixtures__/extensions";
import { buildExtensionGraph, buildHomeGraph } from "@/lib/seo/jsonLd";
import { JsonLd } from "./JsonLd";

const SCRIPT_PATTERN = /^<script type="application\/ld\+json">([\s\S]*)<\/script>$/;

describe("JsonLd", () => {
  it("renders one ld+json script whose contents parse back to the data", () => {
    const graph = buildHomeGraph();
    const html = renderToStaticMarkup(<JsonLd data={graph} />);
    const match = SCRIPT_PATTERN.exec(html);
    expect(match).not.toBeNull();
    expect(JSON.parse(match?.[1] ?? "")).toEqual(graph);
  });

  it("cannot be broken out of by hostile catalog text", () => {
    const hostile = {
      ...verifiedExtension,
      name: "</script><script>alert(1)</script>",
      summary: "<img src=x onerror=alert(1)> & more",
    };
    const html = renderToStaticMarkup(<JsonLd data={buildExtensionGraph(hostile)} />);
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).not.toContain("<img");
  });
});
