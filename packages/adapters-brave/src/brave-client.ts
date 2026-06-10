export type BraveWebResult = {
  title: string;
  url: string;
  description: string;
};

export type BraveClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

const DEFAULT_BASE_URL = "https://api.search.brave.com/res/v1/web/search";

function tokenizeName(label: string): string[] {
  return label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

export function detectWebCollision(
  candidateLabel: string,
  results: BraveWebResult[],
): { collision: boolean; matched: BraveWebResult[] } {
  if (results.length === 0) {
    return { collision: false, matched: [] };
  }

  const tokens = tokenizeName(candidateLabel);
  const compact = candidateLabel.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const matched: BraveWebResult[] = [];

  for (const result of results.slice(0, 5)) {
    const haystack = `${result.title} ${result.description} ${result.url}`.toLowerCase();

    if (compact.length >= 4 && haystack.includes(compact)) {
      matched.push(result);
      continue;
    }

    const hits = tokens.filter((token) => haystack.includes(token));
    if (tokens.length >= 2 && hits.length >= 2) {
      matched.push(result);
    } else if (tokens.length === 1 && hits.length === 1) {
      matched.push(result);
    }
  }

  return { collision: matched.length > 0, matched };
}

export async function searchWeb(
  query: string,
  options: BraveClientOptions,
): Promise<BraveWebResult[]> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const params = new URLSearchParams({
    q: query,
    count: "5",
    search_lang: "en",
  });

  const fetchFn = options.fetchFn ?? fetch;
  const response = await fetchFn(`${baseUrl}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": options.apiKey,
    },
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Brave search failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
  };

  return (payload.web?.results ?? []).map((result) => ({
    title: result.title ?? "",
    url: result.url ?? "",
    description: result.description ?? "",
  }));
}
