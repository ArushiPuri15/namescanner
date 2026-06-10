import type { DomainPriceQuote } from "@namescanner/contracts";

export type NamecheapClientOptions = {
  apiUser: string;
  apiKey: string;
  clientIp: string;
  sandbox?: boolean;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

const LIVE_BASE_URL = "https://api.namecheap.com/xml.response";
const SANDBOX_BASE_URL = "https://api.sandbox.namecheap.com/xml.response";

function baseUrl(sandbox?: boolean): string {
  return sandbox ? SANDBOX_BASE_URL : LIVE_BASE_URL;
}

function normalizeTld(tld: string): string {
  return tld.toLowerCase().replace(/^\./, "");
}

/**
 * Parses Namecheap getPricing XML for REGISTER / 1-year prices.
 * Uses YourPrice when present, otherwise Price.
 */
export function parseRegisterPricing(xml: string, tlds: string[]): DomainPriceQuote[] {
  const registerSection = xml.match(
    /<ProductCategory Name="REGISTER">([\s\S]*?)<\/ProductCategory>/,
  );

  if (!registerSection?.[1]) {
    return [];
  }

  const section = registerSection[1];
  const requested = new Set(tlds.map(normalizeTld));
  const quotes: DomainPriceQuote[] = [];

  const productPattern =
    /<Product Name="([^"]+)">([\s\S]*?)<\/Product>/g;

  for (const match of section.matchAll(productPattern)) {
    const productName = normalizeTld(match[1] ?? "");
    if (!requested.has(productName)) {
      continue;
    }

    const productBody = match[2] ?? "";
    const priceMatch = productBody.match(
      /<Price[^>]*Duration="1"[^>]*YourPrice="([^"]+)"[^>]*Currency="([^"]+)"/,
    ) ??
      productBody.match(
        /<Price[^>]*Duration="1"[^>]*Price="([^"]+)"[^>]*Currency="([^"]+)"/,
      );

    if (!priceMatch?.[1] || !priceMatch[2]) {
      continue;
    }

    quotes.push({
      tld: productName,
      amount: Number.parseFloat(priceMatch[1]),
      currency: priceMatch[2],
      periodYears: 1,
    });
  }

  return quotes;
}

export async function fetchRegisterPricing(
  tlds: string[],
  options: NamecheapClientOptions,
): Promise<DomainPriceQuote[]> {
  const params = new URLSearchParams({
    ApiUser: options.apiUser,
    ApiKey: options.apiKey,
    UserName: options.apiUser,
    ClientIp: options.clientIp,
    Command: "namecheap.users.getPricing",
    ProductType: "DOMAIN",
  });

  const fetchFn = options.fetchFn ?? fetch;
  const response = await fetchFn(`${baseUrl(options.sandbox)}?${params.toString()}`, {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Namecheap pricing request failed with HTTP ${response.status}`);
  }

  const xml = await response.text();

  if (xml.includes("<Status>ERROR</Status>")) {
    const errorText = xml.match(/<Error[^>]*>([^<]+)<\/Error>/)?.[1] ?? "unknown error";
    throw new Error(`Namecheap pricing error: ${errorText}`);
  }

  return parseRegisterPricing(xml, tlds);
}
