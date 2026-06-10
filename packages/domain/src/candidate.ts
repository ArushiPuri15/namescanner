export type CandidateName = {
  /** Display name, e.g. "Matrix Devworks" */
  label: string;
  seed: string;
  suffix: string;
};

function titleCaseToken(token: string): string {
  if (!token) {
    return token;
  }

  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function formatSuffixForDisplay(suffix: string): string {
  return suffix
    .split(/\s+/)
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

export function buildCandidateName(seed: string, suffix: string): CandidateName {
  const normalizedSeed = seed.trim();
  const normalizedSuffix = suffix.trim();
  const displaySuffix = formatSuffixForDisplay(normalizedSuffix);
  const label = displaySuffix ? `${normalizedSeed} ${displaySuffix}` : normalizedSeed;

  return {
    label,
    seed: normalizedSeed,
    suffix: normalizedSuffix,
  };
}

export function generateCandidates(
  seed: string,
  suffixes: string[],
  maxCandidates: number,
): CandidateName[] {
  const uniqueSuffixes = [...new Set(suffixes.map((s) => s.trim()).filter(Boolean))];
  const candidates = uniqueSuffixes.map((suffix) => buildCandidateName(seed, suffix));

  if (candidates.length === 0) {
    return [buildCandidateName(seed, "")].slice(0, maxCandidates);
  }

  return candidates.slice(0, maxCandidates);
}
