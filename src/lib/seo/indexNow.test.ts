import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/site";
import { INDEXNOW_KEY, INDEXNOW_KEY_FILENAME, INDEXNOW_KEY_LOCATION } from "./indexNow";

describe("INDEXNOW_KEY", () => {
  it("is 8 to 128 lowercase hex characters, the shape the protocol requires", () => {
    expect(INDEXNOW_KEY).toMatch(/^[0-9a-f]{8,128}$/);
  });

  it("names the exact route folder that must serve it, and the exact URL that route is reached at", () => {
    expect(INDEXNOW_KEY_FILENAME).toBe(`${INDEXNOW_KEY}.txt`);
    expect(INDEXNOW_KEY_LOCATION).toBe(`${SITE_URL}/${INDEXNOW_KEY}.txt`);
  });
});
