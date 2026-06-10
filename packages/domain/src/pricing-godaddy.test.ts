import { describe, expect, it } from "vitest";
import { buildCandidatePricingFromGodaddyDomains } from "./pricing.js";

describe("buildCandidatePricingFromGodaddyDomains", () => {
  it("builds per-candidate pricing from GoDaddy domain quotes", () => {
    const pricing = buildCandidatePricingFromGodaddyDomains(
      [
        { tld: "in", amount: 14.99, currency: "USD", periodYears: 1 },
        { tld: "co.in", amount: 11.99, currency: "USD", periodYears: 1 },
      ],
      1500,
      83,
    );

    expect(pricing?.provider).toBe("godaddy");
    expect(pricing?.cheapestInr).toBe(995);
    expect(pricing?.withinBudget).toBe(true);
  });
});
