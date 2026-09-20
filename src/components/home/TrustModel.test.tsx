import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { TrustModel } from "./TrustModel";
import { stubIntersectionObserver } from "./__fixtures__/intersection-observer";

describe("TrustModel", () => {
  beforeAll(stubIntersectionObserver);

  it("shows the three states with the catalog date on the verified one", () => {
    render(<TrustModel catalogDate="2026-01-02" />);
    expect(screen.getByRole("heading", { level: 3, name: "Source verified" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Concept" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Not scanned yet" })).toBeInTheDocument();
    const dateElement = screen.getByText("2026-01-02");
    expect(dateElement.tagName).toBe("TIME");
    expect(dateElement).toHaveAttribute("datetime", "2026-01-02");
  });

  it("says scanning is specified but not built and never claims a scan", () => {
    render(<TrustModel catalogDate="2026-01-02" />);
    expect(screen.getByText(/specified but not built/)).toBeInTheDocument();
    expect(screen.getByText(/does not show the code is safe/)).toBeInTheDocument();
  });

  it("has one security link and one publish link, each with a single label", () => {
    render(<TrustModel catalogDate="2026-01-02" />);
    const security = screen.getAllByRole("link", { name: "Read the security model" });
    expect(security).toHaveLength(1);
    expect(security[0].getAttribute("href")).toContain("/security");
    const publish = screen.getAllByRole("link", { name: "Publish an extension" });
    expect(publish).toHaveLength(1);
    expect(publish[0].getAttribute("href")).toContain("/publish");
  });
});
