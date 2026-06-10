import type { DomainPriceQuote } from "@namescanner/contracts";
import type { DomainPricingProvider, ScanContext } from "@namescanner/application";
import { fetchRegisterPricing, type NamecheapClientOptions } from "./namecheap-client.js";

export type NamecheapPricingProviderOptions = Omit<
  NamecheapClientOptions,
  "signal"
> & {
  cacheTtlMs?: number;
};

type PricingCache = {
  key: string;
  expiresAt: number;
  quotes: DomainPriceQuote[];
};

export class NamecheapPricingProvider implements DomainPricingProvider {
  readonly id = "namecheap";
  private cache: PricingCache | null = null;

  constructor(private readonly options: NamecheapPricingProviderOptions) {}

  supports(context: ScanContext): boolean {
    return context.request.tlds.length > 0;
  }

  async getRegistrationPrices(tlds: string[], context: ScanContext): Promise<DomainPriceQuote[]> {
    const normalized = [...new Set(tlds.map((tld) => tld.toLowerCase()))].sort();
    const cacheKey = normalized.join(",");
    const now = Date.now();
    const ttl = this.options.cacheTtlMs ?? 3_600_000;

    if (this.cache && this.cache.key === cacheKey && this.cache.expiresAt > now) {
      return this.cache.quotes;
    }

    const quotes = await fetchRegisterPricing(normalized, {
      ...this.options,
      signal: AbortSignal.timeout(context.timeoutMs),
    });

    this.cache = {
      key: cacheKey,
      expiresAt: now + ttl,
      quotes,
    };

    return quotes;
  }
}
