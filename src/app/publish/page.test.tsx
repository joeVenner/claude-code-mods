import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { PLUGIN_DOCS_LINKS } from "@/components/docs/publishContent";
import { DASH_PATTERN, stubIntersectionObserver } from "@/components/docs/testSupport";
import { extensionSchema } from "@/lib/types";
import PublishPage, { metadata } from "./page";

beforeAll(stubIntersectionObserver);

describe("publish page", () => {
  it("has exactly one h1 and no em or en dashes", () => {
    const { container } = render(<PublishPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.textContent).not.toMatch(DASH_PATTERN);
  });

  it("states that submissions are closed and renders no form controls", () => {
    const { container } = render(<PublishPage />);
    expect(screen.getByText(/There is no submission form, account system or backend/)).toBeInTheDocument();
    expect(container.querySelector("form, input, textarea, select")).toBeNull();
  });

  it("renders every schema field name in the field list", () => {
    render(<PublishPage />);
    for (const field of Object.keys(extensionSchema.shape)) {
      expect(screen.getAllByText(field, { selector: "dt span" }).length).toBeGreaterThan(0);
    }
  });

  it("labels the example entry as not real and shows the fictional slug in JSON", () => {
    render(<PublishPage />);
    expect(screen.getByText(/Example, not a real listing/)).toBeInTheDocument();
    const code = screen.getByLabelText("Example catalog entry as JSON");
    expect(code).toHaveTextContent('"slug": "example-hook-pack"');
  });

  it("links the official plugin docs in a new tab", () => {
    render(<PublishPage />);
    for (const link of PLUGIN_DOCS_LINKS) {
      const anchor = screen.getByRole("link", { name: new RegExp(link.label) });
      expect(anchor).toHaveAttribute("href", link.url);
      expect(anchor).toHaveAttribute("target", "_blank");
    }
  });

  it("keeps the publish API inside a clearly labeled proposed section", () => {
    const { container } = render(<PublishPage />);
    const section = container.querySelector("#proposed-api") as HTMLElement;
    expect(within(section).getByRole("heading", { name: "Proposed publish API, not available" })).toBeInTheDocument();
    expect(within(section).getByText("POST /v1/mods/publish")).toBeInTheDocument();
    expect(container.querySelectorAll("section:not(#proposed-api)")).not.toHaveLength(0);
    const otherText = Array.from(container.querySelectorAll("section:not(#proposed-api)"))
      .map((element) => element.textContent)
      .join(" ");
    expect(otherText).not.toContain("/v1/mods/publish");
  });

  it("exports metadata with a canonical path", () => {
    expect(metadata.alternates?.canonical).toBe("/publish/");
  });
});
