import { SITE_URL } from "@/lib/site";
import indexNowKeyData from "@/data/indexnow-key.json";

/**
 * IndexNow: a small protocol Bing, Yandex, Seznam.cz and Naver share, for telling a search engine a
 * URL changed instead of waiting for its next crawl. Ownership of the host is proven by hosting a
 * key file at `/<key>.txt`, exactly what `src/app/<key>.txt/route.ts` serves, so the key is read from
 * one data file both there and here, and can never drift between the two.
 * @see https://www.indexnow.org/documentation
 */

const KEY_PATTERN = /^[0-9a-f]{8,128}$/;

function readKey(): string {
  const key = indexNowKeyData.key;
  if (!KEY_PATTERN.test(key)) throw new Error(`src/data/indexnow-key.json's key must be 8 to 128 lowercase hex characters, got ${JSON.stringify(key)}`);
  return key;
}

export const INDEXNOW_KEY: string = readKey();
export const INDEXNOW_KEY_FILENAME = `${INDEXNOW_KEY}.txt`;
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY_FILENAME}`;
