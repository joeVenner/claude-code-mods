// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALLOWED_CATALOG_HOSTS as SCRIPT_HOSTS } from "../../scripts/lib/hosts.mjs";
import { ALLOWED_CATALOG_HOSTS as SCHEMA_HOSTS } from "@/lib/url";

describe("catalog host allowlists", () => {
  it("are identical in the schema (src/lib/url.ts) and the verify script (scripts/lib/hosts.mjs)", () => {
    expect([...SCRIPT_HOSTS].sort()).toEqual([...SCHEMA_HOSTS].sort());
  });

  it("are used by the verify script, which must not keep a second list of its own", () => {
    const script = readFileSync(path.join(process.cwd(), "scripts", "verify-catalog.mjs"), "utf8");
    expect(script).toContain('from "./lib/hosts.mjs"');
    expect(script).toContain("new Set(ALLOWED_CATALOG_HOSTS)");
    expect(script).not.toMatch(/new Set\(\[\s*"github\.com"/);
  });
});
