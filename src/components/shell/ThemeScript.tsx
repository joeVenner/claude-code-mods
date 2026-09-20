import type { ReactNode } from "react";
import { THEME_BOOTSTRAP_SCRIPT } from "./theme";

/** Render inside `<head>` of the root layout. Static string only, never catalog or user data. */
export function ThemeScript(): ReactNode {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />;
}
