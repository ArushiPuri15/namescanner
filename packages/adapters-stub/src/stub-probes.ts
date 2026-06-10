import type { ProbeResult, ProbeStatus } from "@namescanner/contracts";
import type { AvailabilityProbe, ScanContext } from "@namescanner/application";
import type { CandidateName } from "@namescanner/domain";
import { slugifyForDomain } from "@namescanner/domain";

export type StubProbeSuiteOptions = {
  /** Domains containing any of these substrings are marked taken */
  takenDomainSubstrings?: string[];
  /** Candidate labels containing any of these substrings trigger web collision */
  takenWebSubstrings?: string[];
  /** GitHub slugs containing any of these substrings are marked taken */
  takenGithubSubstrings?: string[];
  /** Artificial latency for timeout testing */
  delayMs?: number;
};

const DEFAULT_TAKEN_DOMAIN = ["infotech", "softech", "infosystems"];
const DEFAULT_TAKEN_WEB = ["infotech", "solutions"];

function result(
  probe: ProbeResult["probe"],
  status: ProbeStatus,
  evidence: Record<string, unknown>,
  latencyMs: number,
): ProbeResult {
  return {
    probe,
    provider: "stub",
    status,
    confidence: status === "unknown" ? 0.4 : 0.85,
    evidence,
    checkedAt: new Date().toISOString(),
    latencyMs,
  };
}

function matchesAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

export class StubDomainProbe implements AvailabilityProbe {
  readonly id = "domain" as const;

  constructor(private readonly options: StubProbeSuiteOptions = {}) {}

  supports(context: ScanContext): boolean {
    return context.request.probes.includes("domain");
  }

  async check(candidate: CandidateName, context: ScanContext): Promise<ProbeResult> {
    const startedAt = Date.now();
    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }

    const slug = slugifyForDomain(candidate.label);
    const takenHints = this.options.takenDomainSubstrings ?? DEFAULT_TAKEN_DOMAIN;
    const domains = context.request.tlds.map((tld) => `${slug}.${tld}`);
    const anyTaken = domains.some((domain) => matchesAny(domain, takenHints));

    return result(
      "domain",
      anyTaken ? "taken" : "available",
      { domains, slug, mode: "stub" },
      Date.now() - startedAt,
    );
  }
}

export class StubWebProbe implements AvailabilityProbe {
  readonly id = "web" as const;

  constructor(private readonly options: StubProbeSuiteOptions = {}) {}

  supports(context: ScanContext): boolean {
    return context.request.probes.includes("web");
  }

  async check(candidate: CandidateName, context: ScanContext): Promise<ProbeResult> {
    const startedAt = Date.now();
    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }

    const takenHints = this.options.takenWebSubstrings ?? DEFAULT_TAKEN_WEB;
    const collision = matchesAny(candidate.label, takenHints);

    return result(
      "web",
      collision ? "taken" : "available",
      {
        query: `${candidate.label} ${context.request.locale.country}`,
        collision,
        mode: "stub",
      },
      Date.now() - startedAt,
    );
  }
}

export class StubGithubProbe implements AvailabilityProbe {
  readonly id = "github" as const;

  constructor(private readonly options: StubProbeSuiteOptions = {}) {}

  supports(context: ScanContext): boolean {
    return context.request.probes.includes("github");
  }

  async check(candidate: CandidateName, context: ScanContext): Promise<ProbeResult> {
    const startedAt = Date.now();
    if (this.options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.options.delayMs));
    }

    const slug = slugifyForDomain(candidate.label);
    const takenHints = this.options.takenGithubSubstrings ?? ["matrixinfotech"];
    const taken = matchesAny(slug, takenHints);

    return result(
      "github",
      taken ? "taken" : "available",
      { slug, url: `https://github.com/${slug}`, mode: "stub" },
      Date.now() - startedAt,
    );
  }
}

export function createStubProbeSuite(options: StubProbeSuiteOptions = {}): AvailabilityProbe[] {
  return [
    new StubDomainProbe(options),
    new StubWebProbe(options),
    new StubGithubProbe(options),
  ];
}
