import type { ProbeResult } from "@namescanner/contracts";
import type { AvailabilityProbe, ScanContext } from "@namescanner/application";
import type { CandidateName } from "@namescanner/domain";
import { slugifyForDomain } from "@namescanner/domain";
import { aggregateDomainStatuses, lookupDomain, type RdapClientOptions } from "./rdap-client.js";

export type RdapDomainProbeOptions = {
  baseUrl: string;
  fetchFn?: typeof fetch;
};

export class RdapDomainProbe implements AvailabilityProbe {
  readonly id = "domain" as const;

  constructor(private readonly options: RdapDomainProbeOptions) {}

  supports(context: ScanContext): boolean {
    return context.request.probes.includes("domain");
  }

  async check(candidate: CandidateName, context: ScanContext): Promise<ProbeResult> {
    const startedAt = Date.now();
    const slug = slugifyForDomain(candidate.label);
    const clientOptions: RdapClientOptions = {
      baseUrl: this.options.baseUrl,
      fetchFn: this.options.fetchFn,
      signal: AbortSignal.timeout(context.timeoutMs),
    };

    const fqdns = context.request.tlds.map((tld) => `${slug}.${tld.toLowerCase()}`);

    const lookups = await Promise.allSettled(
      fqdns.map((fqdn) => lookupDomain(fqdn, clientOptions)),
    );

    const results = lookups.map((outcome, index) => {
      const fqdn = fqdns[index] ?? "unknown";

      if (outcome.status === "fulfilled") {
        return outcome.value;
      }

      return {
        fqdn,
        status: "error" as const,
        httpStatus: 0,
        source: "rdap",
      };
    });

    const aggregateStatus = aggregateDomainStatuses(results);
    const confidence =
      aggregateStatus === "available" || aggregateStatus === "taken" ? 0.9 : 0.5;

    return {
      probe: "domain",
      provider: "rdap",
      status: aggregateStatus,
      confidence,
      evidence: {
        slug,
        domains: results,
        baseUrl: this.options.baseUrl,
      },
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      error:
        aggregateStatus === "error"
          ? "One or more RDAP lookups failed"
          : undefined,
    };
  }
}
