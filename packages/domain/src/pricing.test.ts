import { describe, expect, it } from "vitest";
import { buildCandidatePricing, derivePricingRisks, quoteToInr } from "./pricing.js";

describe("quoteToInr", () => {
  it("passes through INR amounts", () => {
    expect(quoteToInr({ tld: "in", amount: 799, currency: "INR", periodYears: 1 })).toBe(799);
  });

  it("converts USD using the configured rate", () => {
    expect(quoteToInr({ tld: "com", amount: 10, currency: "USD", periodYears: 1 }, 83)).toBe(830);
  });
});

describe("buildCandidatePricing", () => {
  it("flags candidates outside the INR budget", () => {
    const pricing = buildCandidatePricing(
      "stub",
      [
        { tld: "in", amount: 799, currency: "INR", periodYears: 1 },
        { tld: "com", amount: 12, currency: "USD", periodYears: 1 },
      ],
      700,
      83,
    );

    expect(pricing.cheapestInr).toBe(799);
    expect(pricing.withinBudget).toBe(false);
  });
});

describe("derivePricingRisks", () => {
  it("adds a budget risk when pricing exceeds the limit", () => {
    const pricing = buildCandidatePricing(
      "stub",
      [{ tld: "com", amount: 12, currency: "USD", periodYears: 1 }],
      500,
      83,
    );

    expect(derivePricingRisks(pricing, 500)).toEqual([
      "Cheapest registration (~₹996) exceeds your ₹500 budget",
    ]);
  });
});
