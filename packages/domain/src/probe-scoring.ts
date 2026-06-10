import { aggregateScore, scoreBoringness } from "./scoring.js";

export type ProbeStatus = "available" | "taken" | "unknown" | "error";

export type ProbeScoreInput = {
  probe: string;
  status: ProbeStatus;
};

function statusToAvailabilityScore(status: ProbeStatus): number | null {
  switch (status) {
    case "available":
      return 100;
    case "unknown":
      return 45;
    case "taken":
      return 0;
    case "error":
      return null;
  }
}

function averageScores(scores: number[]): number {
  if (scores.length === 0) {
    return 0;
  }
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

export function scoreDomainFromProbes(domainResults: ProbeScoreInput[]): number {
  const scores = domainResults
    .map((result) => statusToAvailabilityScore(result.status))
    .filter((value): value is number => value !== null);

  return averageScores(scores);
}

export function scoreCollisionFromProbes(webResults: ProbeScoreInput[]): number {
  const scores = webResults
    .map((result) => statusToAvailabilityScore(result.status))
    .filter((value): value is number => value !== null);

  return averageScores(scores);
}

export function deriveRisks(params: {
  probes: ProbeScoreInput[];
  partialFailures: number;
}): string[] {
  const risks: string[] = [];

  if (params.partialFailures > 0) {
    risks.push("One or more probes failed or timed out for this candidate");
  }

  const domainTaken = params.probes.some(
    (result) => result.probe === "domain" && result.status === "taken",
  );
  if (domainTaken) {
    risks.push("One or more requested domains appear registered");
  }

  const webTaken = params.probes.some(
    (result) => result.probe === "web" && result.status === "taken",
  );
  if (webTaken) {
    risks.push("Possible existing business or brand collision found on the web");
  }

  const githubTaken = params.probes.some(
    (result) => result.probe === "github" && result.status === "taken",
  );
  if (githubTaken) {
    risks.push("GitHub username or org may already be in use");
  }

  const allUnknown =
    params.probes.length > 0 &&
    params.probes.every((result) => result.status === "unknown" || result.status === "error");
  if (allUnknown && params.partialFailures === 0) {
    risks.push("Insufficient probe data — verify manually before committing to this name");
  }

  return risks;
}

export function scoreCandidateFromProbes(name: string, probes: ProbeScoreInput[]) {
  const domainResults = probes.filter((result) => result.probe === "domain");
  const webResults = probes.filter((result) => result.probe === "web");

  return aggregateScore({
    domain: scoreDomainFromProbes(domainResults),
    collision: scoreCollisionFromProbes(webResults),
    boringness: scoreBoringness(name),
  });
}
