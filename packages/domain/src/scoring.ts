export type ScoreBreakdown = {
  total: number;
  domain: number;
  collision: number;
  boringness: number;
};

const BORING_SUFFIXES = new Set([
  "devworks",
  "softworks",
  "infoworks",
  "computech",
  "softech",
  "infotech",
  "systems",
  "solutions",
  "services",
  "bureau",
  "practice",
]);

export function scoreBoringness(name: string): number {
  const lower = name.toLowerCase();
  const tokens = lower.split(/\s+/);
  const suffix = tokens.at(-1) ?? "";

  if (BORING_SUFFIXES.has(suffix)) {
    return 90;
  }

  if (tokens.length === 2) {
    return 70;
  }

  return 50;
}

export function aggregateScore(parts: {
  domain: number;
  collision: number;
  boringness: number;
}): ScoreBreakdown {
  const domain = clamp(parts.domain);
  const collision = clamp(parts.collision);
  const boringness = clamp(parts.boringness);
  const total = Math.round(domain * 0.45 + collision * 0.35 + boringness * 0.2);

  return { total, domain, collision, boringness };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
