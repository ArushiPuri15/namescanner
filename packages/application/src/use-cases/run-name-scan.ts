import { randomUUID } from "node:crypto";
import type { ProbeResult, ScanReport, ScanRequest } from "@namescanner/contracts";
import {
  buildCandidatePricing,
  buildCandidatePricingFromGodaddyDomains,
  buildRegistryActions,
  derivePricingRisks,
  deriveRisks,
  generateCandidates,
  scoreCandidateFromProbes,
} from "@namescanner/domain";
import { runProbeWithTimeout } from "../lib/run-probe-with-timeout.js";
import type { AvailabilityProbe } from "../ports/availability-probe.js";
import type { DomainPricingProvider } from "../ports/domain-pricing-provider.js";

export type RunNameScanInput = {
  request: ScanRequest;
  probes: AvailabilityProbe[];
  pricing?: DomainPricingProvider | null;
  usdToInrRate?: number;
  timeoutMs: number;
};

function toScoreInput(probes: ProbeResult[]) {
  return probes.map((result) => ({
    probe: result.probe,
    status: result.status,
  }));
}

function sortCandidatesByScore<T extends { score: { total: number } }>(candidates: T[]): T[] {
  return [...candidates].sort((left, right) => right.score.total - left.score.total);
}

/**
 * Orchestrates candidate generation and probe execution.
 * Adapters are injected — this module never calls external HTTP directly.
 */
export async function runNameScan(input: RunNameScanInput): Promise<ScanReport> {
  const startedAt = Date.now();
  const { request, probes, pricing, usdToInrRate, timeoutMs } = input;

  const context = { request, timeoutMs };
  const activeProbes = probes.filter((probe) => probe.supports(context));
  const requestedProbeIds = new Set(request.probes);
  const activeProbesForRequest = activeProbes.filter((probe) => requestedProbeIds.has(probe.id));

  let pricingSnapshot:
    | ReturnType<typeof buildCandidatePricing>
    | undefined;

  if (pricing?.supports(context)) {
    const quotes = await pricing.getRegistrationPrices(request.tlds, context);
    pricingSnapshot = buildCandidatePricing(
      pricing.id,
      quotes,
      request.constraints.maxDomainPriceInr,
      usdToInrRate,
    );
  }

  const candidates = generateCandidates(
    request.seed,
    request.suffixes,
    request.constraints.maxCandidates,
  );

  const reports = await Promise.all(
    candidates.map(async (candidate) => {
      const probeResults = await Promise.all(
        activeProbesForRequest.map((probe) => runProbeWithTimeout(probe, candidate, context)),
      );

      const partialFailures = probeResults.filter((result) => result.status === "error").length;
      const domainResults = probeResults.filter((result) => result.probe === "domain");
      const godaddyDomain = domainResults.find((result) => result.provider === "godaddy");
      const godaddyDomains = godaddyDomain?.evidence.domains;

      let candidatePricing = pricingSnapshot;
      if (Array.isArray(godaddyDomains)) {
        candidatePricing =
          buildCandidatePricingFromGodaddyDomains(
            godaddyDomains as Array<{
              tld: string;
              amount?: number;
              currency?: string;
              periodYears?: number;
            }>,
            request.constraints.maxDomainPriceInr,
            usdToInrRate,
          ) ?? candidatePricing;
      }

      const pricingRisks = derivePricingRisks(
        candidatePricing,
        request.constraints.maxDomainPriceInr,
      );

      const score = scoreCandidateFromProbes(candidate.label, toScoreInput(probeResults));
      const risks = deriveRisks({
        probes: toScoreInput(probeResults),
        partialFailures,
      });

      if (activeProbesForRequest.length === 0) {
        risks.push("No availability probes are configured — scores reflect naming style only");
      }

      return {
        name: candidate.label,
        domains: domainResults,
        probes: probeResults,
        pricing: candidatePricing,
        score,
        risks: [...risks, ...pricingRisks],
        actions: buildRegistryActions(candidate.label, request.locale),
        _partialFailures: partialFailures,
      };
    }),
  );

  const partialFailures = reports.reduce((sum, report) => sum + report._partialFailures, 0);
  const ranked = sortCandidatesByScore(
    reports.map(({ _partialFailures: _, ...candidate }) => candidate),
  );

  const pricingProvider =
    ranked.find((candidate) => candidate.pricing?.provider)?.pricing?.provider ??
    pricingSnapshot?.provider;

  return {
    scanId: randomUUID(),
    candidates: ranked,
    meta: {
      partialFailures,
      durationMs: Date.now() - startedAt,
      probesRun: activeProbesForRequest.map((probe) => probe.id),
      pricingProvider,
    },
  };
}
