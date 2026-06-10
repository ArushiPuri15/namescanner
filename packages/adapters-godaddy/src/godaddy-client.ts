import type { ProbeStatus } from "@namescanner/contracts";

export type GodaddyAvailabilityResult = {
  domain: string;
  available: boolean;
  definitive: boolean;
  currency?: string;
  priceMicro?: number;
  amount?: number;
  period?: number;
};

export type GodaddyClientOptions = {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

export function microUnitsToAmount(priceMicro: number): number {
  return priceMicro / 1_000_000;
}

export function extractTldFromFqdn(fqdn: string, slug: string): string {
  const prefix = `${slug}.`;
  if (fqdn.startsWith(prefix)) {
    return fqdn.slice(prefix.length);
  }

  const parts = fqdn.split(".");
  return parts.slice(1).join(".");
}

export function aggregateGodaddyStatuses(
  results: Pick<GodaddyAvailabilityResult, "available">[],
): ProbeStatus {
  if (results.length === 0) {
    return "unknown";
  }

  if (results.some((result) => !result.available)) {
    return "taken";
  }

  if (results.every((result) => result.available)) {
    return "available";
  }

  return "unknown";
}

function normalizeAvailabilityResult(raw: {
  domain: string;
  available: boolean;
  definitive: boolean;
  currency?: string;
  price?: number;
  period?: number;
}): GodaddyAvailabilityResult {
  const priceMicro = raw.price;
  return {
    domain: raw.domain,
    available: raw.available,
    definitive: raw.definitive,
    currency: raw.currency,
    priceMicro,
    amount: priceMicro === undefined ? undefined : microUnitsToAmount(priceMicro),
    period: raw.period,
  };
}

export async function checkDomainsBulk(
  domains: string[],
  options: GodaddyClientOptions,
): Promise<GodaddyAvailabilityResult[]> {
  const fetchFn = options.fetchFn ?? fetch;
  const params = new URLSearchParams({ checkType: "FULL" });
  const response = await fetchFn(`${options.baseUrl}/v1/domains/available?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `sso-key ${options.apiKey}:${options.apiSecret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(domains),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`GoDaddy availability check failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    domains?: Array<{
      domain: string;
      available: boolean;
      definitive: boolean;
      currency?: string;
      price?: number;
      period?: number;
    }>;
  };

  return (payload.domains ?? []).map(normalizeAvailabilityResult);
}
