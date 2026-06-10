import { describe, expect, it } from "vitest";
import type { ProbeResult } from "@namescanner/contracts";
import type { CandidateName } from "@namescanner/domain";
import type { DomainPriceQuote } from "@namescanner/contracts";
import type { AvailabilityProbe } from "../ports/availability-probe.js";
import type { DomainPricingProvider } from "../ports/domain-pricing-provider.js";
import { runNameScan } from "./run-name-scan.js";

class StubProbe implements AvailabilityProbe {
  constructor(
    readonly id: "domain" | "web" | "github",
    private readonly status: ProbeResult["status"] = "unknown",
  ) {}

  supports() {
    return true;
  }

  async check(candidate: CandidateName): Promise<ProbeResult> {
    return {
      probe: this.id,
      provider: "stub",
      status: this.status,
      confidence: 0.5,
      evidence: { candidate: candidate.label },
      checkedAt: new Date().toISOString(),
      latencyMs: 1,
    };
  }
}

describe("runNameScan", () => {
  it("runs injected probes for each generated candidate", async () => {
    const report = await runNameScan({
      request: {
        seed: "Matrix",
        locale: { country: "IN" },
        tlds: ["in"],
        suffixes: ["devworks", "softworks"],
        constraints: { style: "boring", maxCandidates: 20 },
        probes: ["domain", "web"],
      },
      probes: [new StubProbe("domain"), new StubProbe("web")],
      timeoutMs: 1000,
    });

    expect(report.candidates).toHaveLength(2);
    expect(report.candidates[0]?.probes).toHaveLength(2);
    expect(report.meta.probesRun).toEqual(["domain", "web"]);
  });

  it("scores and ranks candidates by total score", async () => {
    const report = await runNameScan({
      request: {
        seed: "Matrix",
        locale: { country: "IN" },
        tlds: ["in"],
        suffixes: ["devworks", "infotech"],
        constraints: { style: "boring", maxCandidates: 20 },
        probes: ["domain", "web"],
      },
      probes: [
        new StubProbe("domain", "available"),
        new StubProbe("web", "available"),
      ],
      timeoutMs: 1000,
    });

    expect(report.candidates).toHaveLength(2);
    expect(report.candidates.every((candidate) => candidate.score.total > 0)).toBe(true);
    expect(report.candidates[0]?.actions.mcaSearchUrl).toContain("mca.gov.in");
  });

  it("attaches registrar pricing and budget risks when configured", async () => {
    const pricing: DomainPricingProvider = {
      id: "test-pricing",
      supports: () => true,
      getRegistrationPrices: async (tlds): Promise<DomainPriceQuote[]> =>
        tlds.map((tld) => ({
          tld,
          amount: 999,
          currency: "INR",
          periodYears: 1,
        })),
    };

    const report = await runNameScan({
      request: {
        seed: "Matrix",
        locale: { country: "IN" },
        tlds: ["in"],
        suffixes: ["devworks"],
        constraints: { style: "boring", maxCandidates: 20, maxDomainPriceInr: 500 },
        probes: ["domain"],
      },
      probes: [new StubProbe("domain", "available")],
      pricing,
      timeoutMs: 1000,
    });

    expect(report.meta.pricingProvider).toBe("test-pricing");
    expect(report.candidates[0]?.pricing?.quotes).toHaveLength(1);
    expect(report.candidates[0]?.risks).toContain(
      "Cheapest registration (~₹999) exceeds your ₹500 budget",
    );
  });

  it("includes India registry actions even without probes", async () => {
    const report = await runNameScan({
      request: {
        seed: "Matrix",
        locale: { country: "IN" },
        tlds: ["in"],
        suffixes: ["devworks"],
        constraints: { style: "boring", maxCandidates: 20 },
        probes: ["domain"],
      },
      probes: [],
      timeoutMs: 1000,
    });

    expect(report.candidates[0]?.actions.ipIndiaSearchUrl).toBeDefined();
    expect(report.candidates[0]?.risks).toContain(
      "No availability probes are configured — scores reflect naming style only",
    );
  });
});
