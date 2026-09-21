// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DASH_PATTERN } from "@/components/docs/testSupport";
import { getAllExtensions } from "@/lib/catalog";
import { getIdeas } from "@/lib/ideas";

/**
 * The SEO layer must derive from the catalog. These checks read its own source files, so a slug,
 * a dash or an unsafe HTML sink cannot creep in later without a test noticing.
 */
const SOURCE_ROOT = path.join(process.cwd(), "src");

function listFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

const isSourceFile = (file: string): boolean => /\.(ts|tsx)$/.test(file) && !/\.test\.(ts|tsx)$/.test(file);

const seoSourceFiles: readonly string[] = [
  ...listFiles(path.join(SOURCE_ROOT, "lib", "seo")),
  ...listFiles(path.join(SOURCE_ROOT, "components", "seo")),
  ...["robots.ts", "sitemap.ts", "manifest.ts", "icon.tsx", "apple-icon.tsx", "opengraph-image.tsx", "twitter-image.tsx"].map((name) =>
    path.join(SOURCE_ROOT, "app", name),
  ),
  ...["llms.txt", "llms-full.txt", "feed.xml", "icons"].flatMap((folder) => listFiles(path.join(SOURCE_ROOT, "app", folder))),
  ...listFiles(path.join(SOURCE_ROOT, "app", "extensions")).filter((file) => /(opengraph|twitter)-image/.test(file)),
  ...listFiles(path.join(SOURCE_ROOT, "app", "ideas")).filter((file) => /(opengraph|twitter)-image/.test(file)),
].filter(isSourceFile);

describe("SEO source files", () => {
  it("found the files it is supposed to check", () => {
    expect(seoSourceFiles.length).toBeGreaterThan(15);
  });

  it("never hardcode a catalog or idea slug as a string", () => {
    const slugs = [...getAllExtensions().map((extension) => extension.slug), ...getIdeas().map((idea) => idea.slug)];
    for (const file of seoSourceFiles) {
      const text = readFileSync(file, "utf8");
      for (const slug of slugs) {
        expect(text, `${path.relative(process.cwd(), file)} names ${slug}`).not.toMatch(new RegExp(`["'\`]${slug}["'\`]`));
      }
    }
  });

  it("contain no em or en dashes, even in comments", () => {
    for (const file of seoSourceFiles) {
      expect(DASH_PATTERN.test(readFileSync(file, "utf8")), path.relative(process.cwd(), file)).toBe(false);
    }
  });

  it("use dangerouslySetInnerHTML only in the JSON-LD component", () => {
    const users = seoSourceFiles.filter((file) => readFileSync(file, "utf8").includes("dangerouslySetInnerHTML"));
    expect(users.map((file) => path.basename(file))).toEqual(["JsonLd.tsx"]);
  });

  it("do not use the any type", () => {
    for (const file of seoSourceFiles) {
      expect(readFileSync(file, "utf8"), path.relative(process.cwd(), file)).not.toMatch(/:\s*any\b|as any\b|<any>/);
    }
  });
});

describe("static export image routes", () => {
  it("mark every generated image route as static", () => {
    const imageRoutes = seoSourceFiles.filter((file) => /(opengraph-image|twitter-image|icon|apple-icon)\.tsx$|route\.tsx?$/.test(file));
    expect(imageRoutes.length).toBeGreaterThanOrEqual(8);
    for (const file of imageRoutes) {
      expect(readFileSync(file, "utf8"), path.relative(process.cwd(), file)).toContain('export const dynamic = "force-static"');
    }
  });
});
