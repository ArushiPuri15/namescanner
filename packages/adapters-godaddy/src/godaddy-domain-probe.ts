import type { ProbeResult } from "@namescanner/contracts";
import type { AvailabilityProbe, ScanContext } from "@namescanner/application";
import type { CandidateName } from "@namescanner/domain";
import { slugifyForDomain } from "@namescanner/domain";
import {
  aggregateGodaddyStatuses,
  checkDomainsBulk,
  extractTldFromFqdn,
  type GodaddyClientOptions,
} from "./godaddy-client.js";

export type GodaddyDomainProbeOptions = Omit<GodaddyClientOptions, "signal">;

export class GodaddyDomainProbe implements AvailabilityProbe {
  readonly id = "domain" as const;

  constructor(private readonly options: GodaddyDomainProbeOptions) {}

  supports(context: ScanContext): boolean {
    return context.request.probes.includes("domain");
  }

  async check(candidate: CandidateName, context: ScanContext): Promise<ProbeResult> {
    const startedAt = Date.now();
    const slug = slugifyForDomain(candidate.label);
    const fqdns = context.request.tlds.map((tld) => `${slug}.${tld.toLowerCase()}`);

    try {
      const results = await checkDomainsBulk(fqdns, {
        ...this.options,
        signal: AbortSignal.timeout(context.timeoutMs),
      });

      const aggregateStatus = aggregateGodaddyStatuses(results);
      const confidence =
        aggregateStatus === "available" || aggregateStatus === "taken" ? 0.95 : 0.5;

      return {
        probe: "domain",
        provider: "godaddy",
        status: aggregateStatus,
        confidence,
        evidence: {
          slug,
          domains: results.map((result) => ({
            domain: result.domain,
            tld: extractTldFromFqdn(result.domain, slug),
            available: result.available,
            definitive: result.definitive,
            currency: result.currency,
            priceMicro: result.priceMicro,
            amount: result.amount,
            periodYears: result.period ?? 1,
          })),
          baseUrl: this.options.baseUrl,
        },
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        probe: "domain",
        provider: "godaddy",
        status: "error",
        confidence: 0,
        evidence: { slug, domains: fqdns },
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "GoDaddy availability check failed",
      };
    }
  }
}
