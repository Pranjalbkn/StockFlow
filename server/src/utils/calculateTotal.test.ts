import { describe, expect, it } from "vitest";
import { calculateTotal } from "./calculateTotal.js";

describe("calculateTotal", () => {
  it("calculates totals for multiple line items", () => {
    expect(calculateTotal([
      { quantity: 2, unitAmount: 150.5 },
      { quantity: 3, unitAmount: 25 },
    ])).toBe(376);
  });

  it("rounds monetary values to paise", () => {
    expect(calculateTotal([{ quantity: 3, unitAmount: 0.1 }])).toBe(0.3);
  });
});
