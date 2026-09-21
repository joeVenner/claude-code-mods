import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { getCatalogGeneratedAt } from "@/lib/catalog";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { ThemeScript } from "@/components/shell/ThemeScript";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { Z_CLASS } from "@/lib/site";
import { cn } from "@/lib/cn";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d0e" },
  ],
};

// Props are typed by hand: Next's generated `LayoutProps` lives in the gitignored .next/types,
// so relying on it breaks `tsc` on a fresh clone until a build has run.
interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): ReactNode {
  return (
    <html lang="en" suppressHydrationWarning className={cn(geistSans.variable, geistMono.variable)}>
      <head>
        <ThemeScript />
        {/* Reveal wrappers start hidden; without scripts they would never appear. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className={cn(
            "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-fg",
            Z_CLASS.skipLink,
          )}
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter catalogDate={getCatalogGeneratedAt()} />
        <Analytics />
      </body>
    </html>
  );
}
