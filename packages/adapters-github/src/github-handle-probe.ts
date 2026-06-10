import type { ProbeResult } from "@namescanner/contracts";
import type { AvailabilityProbe, ScanContext } from "@namescanner/application";
import type { CandidateName } from "@namescanner/domain";
import { slugifyForDomain } from "@namescanner/domain";
import {
  githubLookupToStatus,
  lookupGithubSlug,
  type GithubClientOptions,
} from "./github-client.js";

export type GithubHandleProbeOptions = GithubClientOptions;

export class GithubHandleProbe implements AvailabilityProbe {
  readonly id = "github" as const;

  constructor(private readonly options: GithubHandleProbeOptions = {}) {}

  supports(context: ScanContext): boolean {
    return context.request.probes.includes("github");
  }

  async check(candidate: CandidateName, context: ScanContext): Promise<ProbeResult> {
    const startedAt = Date.now();
    const slug = slugifyForDomain(candidate.label).slice(0, 39);

    try {
      const lookup = await lookupGithubSlug(slug, {
        ...this.options,
        signal: AbortSignal.timeout(context.timeoutMs),
      });

      const status = githubLookupToStatus(lookup);
      const confidence =
        status === "available" || status === "taken" ? 0.9 : 0.4;

      return {
        probe: "github",
        provider: "github",
        status,
        confidence,
        evidence: {
          slug,
          kind: lookup.kind,
          profileUrl: lookup.profileUrl ?? `https://github.com/${slug}`,
          httpStatus: lookup.httpStatus,
        },
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        error: status === "error" ? `GitHub lookup failed with HTTP ${lookup.httpStatus}` : undefined,
      };
    } catch (error) {
      return {
        probe: "github",
        provider: "github",
        status: "error",
        confidence: 0,
        evidence: { slug },
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "GitHub lookup failed",
      };
    }
  }
}
