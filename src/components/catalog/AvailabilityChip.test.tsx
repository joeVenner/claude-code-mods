import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AVAILABILITIES, AVAILABILITY_LABELS } from "@/lib/types";
import { AvailabilityChip } from "./AvailabilityChip";

describe("AvailabilityChip", () => {
  it.each(AVAILABILITIES)("shows the label for %s", (availability) => {
    render(<AvailabilityChip availability={availability} />);
    expect(screen.getByText(AVAILABILITY_LABELS[availability])).toBeInTheDocument();
  });
});
