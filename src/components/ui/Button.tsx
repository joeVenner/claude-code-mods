import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { classifyHref } from "@/lib/url";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

interface ButtonBaseProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly iconLeft?: ReactNode;
  readonly iconRight?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}

export type ButtonAsButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & { readonly href?: undefined };

export type ButtonAsLinkProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps | "href"> & { readonly href: string };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const VARIANT_CLASSES: Readonly<Record<ButtonVariant, string>> = {
  primary: "border-transparent bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "border-border-strong bg-surface text-fg hover:border-fg-muted hover:bg-surface-2",
  ghost: "border-transparent bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg",
};

// 44px minimum touch target below md, denser on pointer devices.
const SIZE_CLASSES: Readonly<Record<ButtonSize, string>> = {
  md: "min-h-11 px-4 text-sm md:min-h-10",
  lg: "min-h-12 px-6 text-base",
};

function buildClassName(variant: ButtonVariant, size: ButtonSize, className: string | undefined): string {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control border font-medium",
    "transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}

function ButtonElement({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  className,
  children,
  type = "button",
  ...buttonProps
}: ButtonAsButtonProps): ReactNode {
  return (
    <button type={type} className={buildClassName(variant, size, className)} {...buttonProps}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

function AnchorElement({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  className,
  children,
  href,
  ...anchorProps
}: ButtonAsLinkProps): ReactNode {
  const composedClassName = buildClassName(variant, size, className);
  const content = (
    <>
      {iconLeft}
      {children}
      {iconRight}
    </>
  );

  const hrefKind = classifyHref(href);
  // Fail the render (and so the static build) rather than emit a link with an unexpected scheme.
  if (hrefKind === "unsafe") throw new Error(`Unsafe href rejected: ${JSON.stringify(href)}`);

  if (hrefKind === "external") {
    return (
      <a {...anchorProps} href={href} target="_blank" rel="noopener noreferrer" className={composedClassName}>
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={composedClassName} {...anchorProps}>
      {content}
    </Link>
  );
}

/**
 * Button or link with one visual language. Passing `href` renders an anchor:
 * internal paths and anchors use `next/link`, `https` URLs open in a new tab with `noopener noreferrer`,
 * and any other href (other schemes, protocol-relative, relative paths) throws.
 */
export function Button(props: ButtonProps): ReactNode {
  if (props.href === undefined) return <ButtonElement {...props} />;
  return <AnchorElement {...props} />;
}
