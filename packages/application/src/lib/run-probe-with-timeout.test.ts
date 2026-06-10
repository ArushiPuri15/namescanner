import { describe, expect, it } from "vitest";
import type { ProbeResult } from "@namescanner/contracts";
import type { CandidateName } from "@namescanner/domain";
import type { AvailabilityProbe } from "../ports/availability-probe.js";
import { runProbeWithTimeout } from "./run-probe-with-timeout.js";

class SlowProbe implements AvailabilityProbe {
  readonly id = "domain" as const;

  supports() {
    return true;
  }

  async check(): Promise<ProbeResult> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      probe: "domain",
      provider: "slow",
      status: "available",
      confidence: 1,
      evidence: {},
      checkedAt: new Date().toISOString(),
      latencyMs: 200,
    };
  }
}

const candidate: CandidateName = { label: "Matrix Devworks", seed: "Matrix", suffix: "Devworks" };
const context = {
  request: {
    seed: "Matrix",
    locale: { country: "IN" },
    tlds: ["in"],
    suffixes: ["devworks"],
    constraints: { style: "boring" as const, maxCandidates: 20 },
    probes: ["domain" as const],
  },
  timeoutMs: 50,
};

describe("runProbeWithTimeout", () => {
  it("returns error when probe exceeds timeout", async () => {
    const result = await runProbeWithTimeout(new SlowProbe(), candidate, context);

    expect(result.status).toBe("error");
    expect(result.error).toContain("timed out");
  });
});
