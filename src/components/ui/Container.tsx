import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ContainerElement = "div" | "section" | "header" | "footer" | "nav" | "article" | "main";

export interface ContainerProps {
  readonly as?: ContainerElement;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Page-width wrapper: 1200px max, 16px gutter on mobile, 32px from md up. */
export function Container({ as: Element = "div", className, children }: ContainerProps): ReactNode {
  return <Element className={cn("mx-auto w-full max-w-[1200px] px-4 md:px-8", className)}>{children}</Element>;
}
