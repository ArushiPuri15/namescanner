const DEFAULT_USD_TO_INR = 83;

export type DomainPriceQuoteInput = {
  tld: string;
  amount: number;
  currency: string;
  periodYears: number;
};

export type CandidatePricingResult = {
  provider: string;
  quotes: DomainPriceQuoteInput[];
  cheapestInr?: number;
  withinBudget?: boolean;
};

export function quoteToInr(quote: DomainPriceQuoteInput, usdToInrRate = DEFAULT_USD_TO_INR): number {
  if (quote.currency === "INR") {
    return Math.round(quote.amount);
  }

  if (quote.currency === "USD") {
    return Math.round(quote.amount * usdToInrRate);
  }

  return Math.round(quote.amount);
}

export function buildCandidatePricing(
  provider: string,
  quotes: DomainPriceQuoteInput[],
  maxDomainPriceInr?: number,
  usdToInrRate = DEFAULT_USD_TO_INR,
): CandidatePricingResult {
  const inrValues = quotes.map((quote) => quoteToInr(quote, usdToInrRate));
  const cheapestInr = inrValues.length > 0 ? Math.min(...inrValues) : undefined;

  return {
    provider,
    quotes,
    cheapestInr,
    withinBudget:
      maxDomainPriceInr === undefined || cheapestInr === undefined
        ? undefined
        : cheapestInr <= maxDomainPriceInr,
  };
}

export type GodaddyDomainPriceInput = {
  tld: string;
  amount?: number;
  currency?: string;
  periodYears?: number;
};

export function buildCandidatePricingFromGodaddyDomains(
  domains: GodaddyDomainPriceInput[],
  maxDomainPriceInr?: number,
  usdToInrRate = DEFAULT_USD_TO_INR,
): CandidatePricingResult | undefined {
  const quotes = domains
    .filter((domain) => domain.amount !== undefined && domain.currency !== undefined)
    .map((domain) => ({
      tld: domain.tld,
      amount: domain.amount as number,
      currency: domain.currency as string,
      periodYears: domain.periodYears ?? 1,
    }));

  if (quotes.length === 0) {
    return undefined;
  }

  return buildCandidatePricing("godaddy", quotes, maxDomainPriceInr, usdToInrRate);
}

export function derivePricingRisks(
  pricing: CandidatePricingResult | undefined,
  maxDomainPriceInr?: number,
): string[] {
  if (!pricing || maxDomainPriceInr === undefined || pricing.withinBudget !== false) {
    return [];
  }

  return [
    `Cheapest registration (~₹${pricing.cheapestInr}) exceeds your ₹${maxDomainPriceInr} budget`,
  ];
}
