import type { Extension } from "@/lib/types";

/**
 * Anthropic's mods that ship inside Claude Code, as the catalog records them. Pages describe these
 * mods only through this selection, so a sentence about "mods that ship inside Claude Code" can never
 * be true of a community entry: a community entry cannot be built-in.
 */
export function selectAnthropicBuiltInMods(extensions: readonly Extension[]): readonly Extension[] {
  return extensions.filter(
    (extension) =>
      extension.kind === "mod" && extension.publisher.kind === "anthropic" && extension.availability === "built-in",
  );
}

/** Prefers a mod in the security category, otherwise the first one, so the example is stable. */
export function pickExampleMod(mods: readonly Extension[]): Extension | undefined {
  return mods.find((mod) => mod.categories.includes("security")) ?? mods[0];
}

/**
 * The built-in mod that the Security page's seat facts are about. `SECURITY_MOD_FACTS` is written
 * from sec-default's own README, so the mod is chosen by its repository, not by name or category: a
 * renamed sec-default is still picked up, and a different mod that merely looks like it (same
 * category, hooks every classic event, even the name "sec-default") is not, because it would render
 * facts that are not about its own source. Undefined when no mod's source is that repository.
 */
export function pickSecurityMod(mods: readonly Extension[]): Extension | undefined {
  return mods.find((mod) => mod.repositoryUrl.endsWith("/mods/sec-default"));
}

/** `owner/repo` from a github.com repository URL, or null when the URL is not shaped that way. */
export function repositoryNameOf(repositoryUrl: string): string | null {
  if (!URL.canParse(repositoryUrl)) return null;
  const url = new URL(repositoryUrl);
  if (url.hostname !== "github.com") return null;
  const [owner, repo] = url.pathname.split("/").filter((segment) => segment !== "");
  return owner !== undefined && repo !== undefined ? `${owner}/${repo}` : null;
}

/** The notice text shared by every one of these mods, or null when they differ or have none. */
export function sharedNotice(mods: readonly Extension[]): string | null {
  const [first, ...rest] = mods;
  if (first === undefined || first.notice === null) return null;
  return rest.every((mod) => mod.notice === first.notice) ? first.notice : null;
}
