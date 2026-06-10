import type { DomainPriceQuote } from "@namescanner/contracts";
import type { ScanContext } from "./availability-probe.js";

export interface DomainPricingProvider {
  readonly id: string;
  supports(context: ScanContext): boolean;
  getRegistrationPrices(tlds: string[], context: ScanContext): Promise<DomainPriceQuote[]>;
}
