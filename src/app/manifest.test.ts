// @vitest-environment node
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND_COLORS } from "@/lib/seo/brandMark";
import { SITE_NAME } from "@/lib/site";
import manifest, { dynamic } from "./manifest";

describe("manifest", () => {
  const result = manifest();

  it("is statically rendered for the export build", () => {
    expect(dynamic).toBe("force-static");
  });

  it("names the app and starts at the home page as a standalone app", () => {
    expect(result.name).toBe(SITE_NAME);
    expect(result.short_name).toBeTruthy();
    expect((result.short_name ?? "").length).toBeLessThanOrEqual(12);
    expect(result.description).toBeTruthy();
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
  });

  it("takes both colours from the palette", () => {
    expect(result.background_color).toBe(BRAND_COLORS.background);
    expect(result.theme_color).toBe(BRAND_COLORS.background);
  });

  it("lists 192 and 512 pixel icons and a maskable one", () => {
    const icons = result.icons ?? [];
    expect(icons.some((icon) => icon.sizes === "192x192" && icon.type === "image/png")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable")).toBe(true);
  });

  it("only lists icons that a route in the app folder produces", () => {
    for (const icon of result.icons ?? []) {
      expect(icon.src.startsWith("/icons/")).toBe(true);
      const routeFolder = path.join(process.cwd(), "src", "app", ...icon.src.split("/").filter(Boolean));
      expect(existsSync(path.join(routeFolder, "route.tsx")), icon.src).toBe(true);
    }
  });
});
