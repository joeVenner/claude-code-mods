import {
  Anchor,
  Flask,
  Lightning,
  PlugsConnected,
  PuzzlePiece,
  Robot,
  Terminal,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { ExtensionKind } from "@/lib/types";

/** One distinct glyph per kind so a list can be scanned without reading labels. */
export const KIND_ICONS: Readonly<Record<ExtensionKind, Icon>> = {
  plugin: PuzzlePiece,
  skill: Lightning,
  agent: Robot,
  hook: Anchor,
  "mcp-server": PlugsConnected,
  command: Terminal,
  mod: Flask,
};

export interface KindIconProps {
  readonly kind: ExtensionKind;
  readonly size?: number;
  readonly className?: string;
}

/** Decorative: the kind's text label always sits next to it, so the icon is hidden from assistive tech. */
export function KindIcon({ kind, size = 18, className }: KindIconProps): ReactNode {
  const IconComponent = KIND_ICONS[kind];
  return <IconComponent size={size} weight="regular" aria-hidden="true" className={className} />;
}
