// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchText, readCappedText } from "../../scripts/lib/fetch-capped.mjs";

function streamOf(chunks: readonly string[]): { readonly response: Response; readonly wasCancelled: () => boolean } {
  let cancelled = false;
  const encoder = new TextEncoder();
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) controller.enqueue(encoder.encode(chunks[index++]));
      else controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  return { response: new Response(body, { status: 200 }), wasCancelled: () => cancelled };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readCappedText", () => {
  it("joins the chunks of a body under the cap", async () => {
    const { response } = streamOf(["hel", "lo ", "world"]);
    expect(await readCappedText(response, "https://example.test/a", 100)).toBe("hello world");
  });

  it("accepts a body exactly at the cap", async () => {
    const { response } = streamOf(["12345"]);
    expect(await readCappedText(response, "https://example.test/a", 5)).toBe("12345");
  });

  it("stops reading and cancels the stream as soon as the body passes the cap", async () => {
    const { response, wasCancelled } = streamOf(["12345", "67890", "never read"]);
    await expect(readCappedText(response, "https://example.test/big", 8)).rejects.toThrow(/https:\/\/example\.test\/big is over the 8 byte limit/);
    expect(wasCancelled()).toBe(true);
  });

  it("counts bytes, not characters, so multibyte text cannot slip under the cap", async () => {
    const { response } = streamOf(["éééé"]);
    await expect(readCappedText(response, "https://example.test/u", 6)).rejects.toThrow(/over the 6 byte limit/);
  });

  it("says so when there is no body", async () => {
    await expect(readCappedText(new Response(null, { status: 200 }), "https://example.test/none")).rejects.toThrow(/returned no body/);
  });
});

describe("fetchText", () => {
  it("asks for no redirects, sets a timeout signal and returns the text", async () => {
    const fetchMock = vi.fn(async () => streamOf(["ok"]).response);
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchText("https://example.test/a")).toBe("ok");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.redirect).toBe("error");
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("refuses any status but 200, naming the URL and the status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404 })));
    await expect(fetchText("https://example.test/missing")).rejects.toThrow(/https:\/\/example\.test\/missing answered HTTP 404/);
  });

  it("passes the size cap on to the reader", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => streamOf(["1234567890"]).response));
    await expect(fetchText("https://example.test/big", { maxBytes: 4 })).rejects.toThrow(/over the 4 byte limit/);
  });

  it("lets a network failure through instead of hiding it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    await expect(fetchText("https://example.test/down")).rejects.toThrow("fetch failed");
  });
});
