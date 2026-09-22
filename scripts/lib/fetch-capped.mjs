// A GET for the maintenance scripts: a timeout, no redirects and a size cap that counts bytes as they
// arrive. No fs here, so vitest can import this file (src/lib/fetch-capped.test.ts).

export const DEFAULT_TIMEOUT_MS = 20_000;
// The declarations are about 0.5 MB today; anything far beyond that is not what we expect to parse.
export const DEFAULT_MAX_BYTES = 4 * 1024 * 1024;
const USER_AGENT = "claude-code-mods-scripts";

/**
 * Reads the body chunk by chunk and stops as soon as it passes the cap. Counting after decompression
 * is the point: a small compressed body must not be able to fill memory before a size check runs.
 * @param {Response} response
 * @param {string} url named in errors
 * @param {number} maxBytes
 * @returns {Promise<string>}
 */
export async function readCappedText(response, url, maxBytes = DEFAULT_MAX_BYTES) {
  const reader = response.body?.getReader();
  if (reader === undefined) throw new Error(`${url} returned no body`);
  const chunks = [];
  let totalBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error(`${url} is over the ${maxBytes} byte limit`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * GET `url` as text. Refuses redirects and any status but 200. Callers build `url` from fixed hosts.
 * @param {string} url
 * @param {{ timeoutMs?: number, maxBytes?: number }} [options]
 * @returns {Promise<string>}
 */
export async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    headers: { "user-agent": USER_AGENT, accept: "application/vnd.github+json, text/plain" },
  });
  if (response.status !== 200) throw new Error(`${url} answered HTTP ${response.status}`);
  return readCappedText(response, url, options.maxBytes);
}
