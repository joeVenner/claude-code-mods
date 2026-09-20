import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { getAllExtensions, getCatalogGeneratedAt } from "@/lib/catalog";
import { DISCLAIMER } from "@/lib/site";
import AboutPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("about page", () => {
  it("has exactly one h1 and no em or en dashes", () => {
    const { container } = render(<AboutPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
  });

  it("carries the unofficial disclaimer", () => {
    render(<AboutPage />);
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
  });

  it("states the unresolved repositories fact plainly", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(
        /The specification named public repositories for these ideas\. None of them resolved on \d{4}-\d{2}-\d{2}, so they are listed as concepts\./,
      ),
    ).toBeInTheDocument();
  });

  it("derives entry counts and the catalog date from the catalog", () => {
    render(<AboutPage />);
    const total = getAllExtensions().length;
    expect(screen.getByText(new RegExp(`currently holds ${total} entries`))).toBeInTheDocument();
    expect(screen.getByText(getCatalogGeneratedAt())).toBeInTheDocument();
  });

  it("shows how to re-verify", () => {
    render(<AboutPage />);
    expect(screen.getByText("npm run catalog:verify")).toBeInTheDocument();
  });

  it("does not present the mods runtime as shipping", () => {
    render(<AboutPage />);
    expect(screen.getByText(/could not confirm that it exists/)).toBeInTheDocument();
  });

  it("exports metadata with a canonical path", () => {
    expect(metadata.alternates?.canonical).toBe("/about/");
  });
});
