import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NAV_LINKS, isNavLinkActive } from "@/lib/site";
import { SiteHeader } from "./SiteHeader";

const pathnameMock = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.current,
}));

describe("SiteHeader", () => {
  beforeEach(() => {
    pathnameMock.current = "/";
  });

  it("renders the wordmark as a home link", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Claude Code Mods" })).toHaveAttribute("href", "/");
  });

  it("lists every nav link in the desktop and mobile navs", () => {
    render(<SiteHeader />);
    for (const link of NAV_LINKS) {
      const matches = screen.getAllByRole("link", { name: link.label, hidden: true });
      expect(matches).toHaveLength(2);
      matches.forEach((match) => expect(match.getAttribute("href")).toBe(link.href.replace(/\/$/, "")));
    }
  });

  it("marks the current section with aria-current", () => {
    pathnameMock.current = "/extensions/fixture-lint-runner/";
    render(<SiteHeader />);
    const browseLinks = screen.getAllByRole("link", { name: "Browse", hidden: true });
    browseLinks.forEach((link) => expect(link).toHaveAttribute("aria-current", "page"));
    const aboutLinks = screen.getAllByRole("link", { name: "About", hidden: true });
    aboutLinks.forEach((link) => expect(link).not.toHaveAttribute("aria-current"));
  });

  describe("Learn dropdown", () => {
    const learn = NAV_LINKS.find((link) => link.label === "Learn");
    if (learn?.children === undefined) throw new Error("fixture assumption: Learn has children");
    const children = learn.children;

    it("starts closed, and the Learn label itself still links straight to /learn/", () => {
      render(<SiteHeader />);
      const desktopNav = screen.getByRole("navigation", { name: "Primary" });
      expect(within(desktopNav).getByRole("link", { name: "Learn" })).toHaveAttribute("href", "/learn");
      const caret = within(desktopNav).getByRole("button", { name: "Learn submenu" });
      expect(caret).toHaveAttribute("aria-expanded", "false");
      expect(document.getElementById(caret.getAttribute("aria-controls") as string)).toHaveAttribute("hidden");
    });

    it("opens on click and lists every child with its real href", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      const desktopNav = screen.getByRole("navigation", { name: "Primary" });
      await user.click(within(desktopNav).getByRole("button", { name: "Learn submenu" }));

      expect(within(desktopNav).getByRole("button", { name: "Learn submenu" })).toHaveAttribute("aria-expanded", "true");
      for (const child of children) {
        expect(within(desktopNav).getByRole("link", { name: child.label })).toHaveAttribute("href", child.href.replace(/\/$/, ""));
      }
    });

    it("closes on Escape and returns focus to the caret", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      const desktopNav = screen.getByRole("navigation", { name: "Primary" });
      const caret = within(desktopNav).getByRole("button", { name: "Learn submenu" });
      await user.click(caret);
      expect(caret).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Escape}");

      expect(caret).toHaveAttribute("aria-expanded", "false");
      expect(caret).toHaveFocus();
    });

    it("closes on a click outside the dropdown", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      const desktopNav = screen.getByRole("navigation", { name: "Primary" });
      await user.click(within(desktopNav).getByRole("button", { name: "Learn submenu" }));
      expect(within(desktopNav).getByRole("button", { name: "Learn submenu" })).toHaveAttribute("aria-expanded", "true");

      await user.click(document.body);

      expect(within(desktopNav).getByRole("button", { name: "Learn submenu" })).toHaveAttribute("aria-expanded", "false");
    });

    it("closes when a child link is chosen", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      const desktopNav = screen.getByRole("navigation", { name: "Primary" });
      await user.click(within(desktopNav).getByRole("button", { name: "Learn submenu" }));
      const link = within(desktopNav).getByRole("link", { name: children[0].label });
      link.addEventListener("click", (event) => event.preventDefault());

      await user.click(link);

      expect(within(desktopNav).getByRole("button", { name: "Learn submenu" })).toHaveAttribute("aria-expanded", "false");
    });

    it("also lists every child, always visible, in the mobile menu", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileNav = screen.getByRole("navigation", { name: "Mobile" });
      for (const child of children) {
        expect(within(mobileNav).getByRole("link", { name: child.label })).toHaveAttribute("href", child.href.replace(/\/$/, ""));
      }
    });

    it("marks the active child with aria-current in both the dropdown and the mobile menu", async () => {
      pathnameMock.current = children[0].href;
      const user = userEvent.setup();
      render(<SiteHeader />);
      const desktopNav = screen.getByRole("navigation", { name: "Primary" });
      await user.click(within(desktopNav).getByRole("button", { name: "Learn submenu" }));
      expect(within(desktopNav).getByRole("link", { name: children[0].label })).toHaveAttribute("aria-current", "page");
      expect(within(desktopNav).getByRole("link", { name: children[1].label })).not.toHaveAttribute("aria-current");

      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileNav = screen.getByRole("navigation", { name: "Mobile" });
      expect(within(mobileNav).getByRole("link", { name: children[0].label })).toHaveAttribute("aria-current", "page");
    });

    it("does not give any other top-level link a dropdown", () => {
      render(<SiteHeader />);
      const desktopNav = screen.getByRole("navigation", { name: "Primary" });
      const others = NAV_LINKS.filter((link) => link.label !== "Learn");
      for (const link of others) {
        expect(within(desktopNav).queryByRole("button", { name: `${link.label} submenu` }), link.label).not.toBeInTheDocument();
      }
    });
  });

  describe("mobile menu", () => {
    it("stays closed when you navigate away and come back to the page it was opened on", async () => {
      pathnameMock.current = "/browse/";
      const { rerender } = render(<SiteHeader />);
      await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
      expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");

      pathnameMock.current = "/security/";
      rerender(<SiteHeader />);
      pathnameMock.current = "/browse/";
      rerender(<SiteHeader />);

      expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
    });

    it("starts closed with a correctly wired disclosure button", () => {
      render(<SiteHeader />);
      const button = screen.getByRole("button", { name: "Open menu" });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-controls", "mobile-menu");
      expect(document.getElementById("mobile-menu")).toHaveAttribute("hidden");
    });

    it("opens and closes with the toggle and updates aria-expanded", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);

      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const closeButton = screen.getByRole("button", { name: "Close menu" });
      expect(closeButton).toHaveAttribute("aria-expanded", "true");
      expect(document.getElementById("mobile-menu")).not.toHaveAttribute("hidden");
      expect(screen.getByRole("navigation", { name: "Mobile" })).toBeVisible();

      await user.click(closeButton);
      expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
      expect(document.getElementById("mobile-menu")).toHaveAttribute("hidden");
    });

    it("closes on Escape and returns focus to the toggle", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Escape}");

      const button = screen.getByRole("button", { name: "Open menu" });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveFocus();
    });

    it("closes when a menu link is chosen", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));

      const mobileNav = screen.getByRole("navigation", { name: "Mobile" });
      const link = mobileNav.querySelector<HTMLAnchorElement>('a[href^="/security"]');
      expect(link).not.toBeNull();
      link?.addEventListener("click", (event) => event.preventDefault());
      await user.click(link as HTMLAnchorElement);

      expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
    });

    it("does not react to Escape while closed", async () => {
      const user = userEvent.setup();
      render(<SiteHeader />);
      const button = screen.getByRole("button", { name: "Open menu" });
      button.blur();
      await user.keyboard("{Escape}");
      expect(button).not.toHaveFocus();
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });
});

describe("isNavLinkActive", () => {
  const browse = NAV_LINKS[0];

  it("matches the section root, nested paths and configured prefixes", () => {
    expect(isNavLinkActive("/browse/", browse)).toBe(true);
    expect(isNavLinkActive("/browse", browse)).toBe(true);
    expect(isNavLinkActive("/extensions/some-slug/", browse)).toBe(true);
  });

  it("does not match unrelated paths or partial segment names", () => {
    expect(isNavLinkActive("/", browse)).toBe(false);
    expect(isNavLinkActive("/browser/", browse)).toBe(false);
    expect(isNavLinkActive("/about/", browse)).toBe(false);
  });
});
