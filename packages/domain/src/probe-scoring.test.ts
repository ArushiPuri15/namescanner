import { describe, expect, it } from "vitest";
import {
  deriveRisks,
  scoreCandidateFromProbes,
  scoreCollisionFromProbes,
  scoreDomainFromProbes,
  type ProbeScoreInput,
} from "./probe-scoring.js";

function probe(partial: ProbeScoreInput): ProbeScoreInput {
  return partial;
}

describe("probe scoring", () => {
  it("scores available domains highly", () => {
    expect(
      scoreDomainFromProbes([
        probe({ probe: "domain", status: "available" }),
        probe({ probe: "domain", status: "available" }),
      ]),
    ).toBe(100);
  });

  it("penalizes taken web collisions", () => {
    expect(scoreCollisionFromProbes([probe({ probe: "web", status: "taken" })])).toBe(0);
  });

  it("aggregates candidate score with boringness", () => {
    const score = scoreCandidateFromProbes("Matrix Devworks", [
      probe({ probe: "domain", status: "available" }),
      probe({ probe: "web", status: "available" }),
    ]);

    expect(score.boringness).toBe(90);
    expect(score.total).toBeGreaterThan(70);
  });

  it("surfaces collision and domain risks", () => {
    const risks = deriveRisks({
      probes: [
        probe({ probe: "domain", status: "taken" }),
        probe({ probe: "web", status: "taken" }),
      ],
      partialFailures: 0,
    });

    expect(risks).toContain("One or more requested domains appear registered");
    expect(risks).toContain("Possible existing business or brand collision found on the web");
  });
});
