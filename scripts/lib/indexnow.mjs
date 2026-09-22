// Pure helpers for scripts/submit-indexnow.mjs. No network and no fs here, so vitest can import this
// file directly (src/lib/indexnow-cli.test.ts).

const KEY_PATTERN = /^[0-9a-f]{8,128}$/;
const LOC_PATTERN = /<loc>([^<]+)<\/loc>/g;

export const DEFAULT_SITE_URL = "https://claudecodemods.com";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** @param {readonly string[]} argv */
export function parseArguments(argv) {
  const options = { urls: [], dryRun: false, siteUrl: DEFAULT_SITE_URL };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--url") {
      options.urls.push(argv[index + 1] ?? "");
      index += 1;
    } else if (argument === "--site") {
      options.siteUrl = argv[index + 1] ?? "";
      index += 1;
    } else {
      throw new Error(`unknown argument ${JSON.stringify(argument)}`);
    }
  }
  return options;
}

/** @param {string} key */
export function isValidKey(key) {
  return KEY_PATTERN.test(key);
}

/** Every `<loc>` in a sitemap document, in document order. @param {string} xml */
export function extractSitemapUrls(xml) {
  return Array.from(xml.matchAll(LOC_PATTERN), (match) => match[1]);
}

/**
 * The JSON body for a batch submission (up to 10,000 URLs per the protocol).
 * @param {{ urls: readonly string[], key: string, siteUrl: string }} input
 * @throws {Error} for an empty list, an invalid key, or a URL off `siteUrl`'s host.
 */
export function buildSubmissionPayload({ urls, key, siteUrl }) {
  if (urls.length === 0) throw new Error("no URLs to submit");
  if (!isValidKey(key)) throw new Error(`key must be 8 to 128 lowercase hex characters, got ${JSON.stringify(key)}`);
  const host = new URL(siteUrl).host;
  for (const url of urls) {
    if (new URL(url).host !== host) throw new Error(`${url} is not on ${host}, refusing to submit another host's URL`);
  }
  return { host, key, keyLocation: `${siteUrl}/${key}.txt`, urlList: urls };
}
