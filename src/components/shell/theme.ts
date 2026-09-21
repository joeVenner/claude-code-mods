export type ThemePreference = "light" | "dark";

export const THEME_STORAGE_KEY = "cc-mods-theme";

/**
 * Runs before first paint so a saved choice never flashes the wrong palette.
 * Hardcoded on purpose: it is injected with dangerouslySetInnerHTML and must never
 * contain runtime data. When storage is blocked the page simply follows the system theme.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark";
}
