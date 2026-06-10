import type { DomainPriceQuote } from "@namescanner/contracts";
import type { DomainPricingProvider, ScanContext } from "@namescanner/application";

const DEFAULT_STUB_PRICES_INR: Record<string, number> = {
  in: 799,
  "co.in": 699,
  com: 999,
  net: 1099,
  org: 999,
};

export type StubDomainPricingOptions = {
  pricesInr?: Record<string, number>;
  defaultPriceInr?: number;
};

export class StubDomainPricingProvider implements DomainPricingProvider {
  readonly id = "stub-pricing";

  constructor(private readonly options: StubDomainPricingOptions = {}) {}

  supports(): boolean {
    return true;
  }

  async getRegistrationPrices(tlds: string[], _context: ScanContext): Promise<DomainPriceQuote[]> {
    const table = this.options.pricesInr ?? DEFAULT_STUB_PRICES_INR;
    const fallback = this.options.defaultPriceInr ?? 899;

    return tlds.map((tld) => ({
      tld,
      amount: table[tld.toLowerCase()] ?? fallback,
      currency: "INR",
      periodYears: 1,
    }));
  }
}
