import type { ProbeResult } from "@namescanner/contracts";
import type { AvailabilityProbe, ScanContext } from "@namescanner/application";
import type { CandidateName } from "@namescanner/domain";
import { detectWebCollision, searchWeb, type BraveClientOptions } from "./brave-client.js";

export type BraveWebProbeOptions = Omit<BraveClientOptions, "signal" | "apiKey"> & {
  apiKey: string;
};

function buildSearchQuery(candidate: CandidateName, country: string): string {
  return `"${candidate.label}" company ${country}`;
}

export class BraveWebProbe implements AvailabilityProbe {
  readonly id = "web" as const;

  constructor(private readonly options: BraveWebProbeOptions) {}

  supports(context: ScanContext): boolean {
    return (
      context.request.probes.includes("web") && Boolean(this.options.apiKey)
    );
  }

  async check(candidate: CandidateName, context: ScanContext): Promise<ProbeResult> {
    const startedAt = Date.now();
    const query = buildSearchQuery(candidate, context.request.locale.country);

    try {
      const results = await searchWeb(query, {
        ...this.options,
        signal: AbortSignal.timeout(context.timeoutMs),
      });

      const { collision, matched } = detectWebCollision(candidate.label, results);
      const status = collision ? "taken" : results.length === 0 ? "available" : "unknown";

      return {
        probe: "web",
        provider: "brave",
        status,
        confidence: collision ? 0.75 : results.length === 0 ? 0.7 : 0.45,
        evidence: {
          query,
          resultCount: results.length,
          matched,
          topResults: results.slice(0, 3),
        },
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        probe: "web",
        provider: "brave",
        status: "error",
        confidence: 0,
        evidence: { query },
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "Brave search failed",
      };
    }
  }
}
