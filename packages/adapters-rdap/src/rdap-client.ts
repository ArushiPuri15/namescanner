import type { ProbeStatus } from "@namescanner/contracts";

export type RdapLookupResult = {
  fqdn: string;
  status: ProbeStatus;
  httpStatus: number;
  source: string;
};

export type RdapClientOptions = {
  baseUrl: string;
  fetchFn?: typeof fetch;
  signal?: AbortSignal;
};

function mapHttpStatusToProbeStatus(httpStatus: number): ProbeStatus {
  if (httpStatus === 404) {
    return "available";
  }

  if (httpStatus >= 200 && httpStatus < 300) {
    return "taken";
  }

  if (httpStatus === 429) {
    return "unknown";
  }

  return "error";
}

/**
 * Queries a public RDAP aggregator. A 404 generally means the domain is not registered.
 */
export async function lookupDomain(
  fqdn: string,
  options: RdapClientOptions,
): Promise<RdapLookupResult> {
  const fetchFn = options.fetchFn ?? fetch;
  const url = `${options.baseUrl.replace(/\/$/, "")}/${encodeURIComponent(fqdn)}`;

  const response = await fetchFn(url, {
    method: "GET",
    headers: { accept: "application/rdap+json, application/json" },
    signal: options.signal,
  });

  return {
    fqdn,
    status: mapHttpStatusToProbeStatus(response.status),
    httpStatus: response.status,
    source: "rdap",
  };
}

export function aggregateDomainStatuses(results: RdapLookupResult[]): ProbeStatus {
  if (results.length === 0) {
    return "unknown";
  }

  if (results.some((result) => result.status === "taken")) {
    return "taken";
  }

  if (results.some((result) => result.status === "error")) {
    return "error";
  }

  if (results.every((result) => result.status === "available")) {
    return "available";
  }

  return "unknown";
}
