import { describe, expect, it } from "vitest";
import type { ProbeResult } from "@namescanner/contracts";
import type { CandidateName } from "@namescanner/domain";
import type { AvailabilityProbe } from "../ports/availability-probe.js";
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
