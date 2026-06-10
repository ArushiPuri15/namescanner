import { describe, expect, it } from "vitest";
import { buildCandidateName, generateCandidates } from "./candidate.js";

describe("buildCandidateName", () => {
  it("title-cases suffixes for display labels", () => {
    expect(buildCandidateName("Matrix", "devworks").label).toBe("Matrix Devworks");
    expect(buildCandidateName("Matrix", "softworks").label).toBe("Matrix Softworks");
  });

  it("preserves the raw suffix for downstream slug and matching logic", () => {
    const candidate = buildCandidateName("Matrix", "devworks");
    expect(candidate.suffix).toBe("devworks");
  });
});

describe("generateCandidates", () => {
  it("deduplicates suffixes after trimming", () => {
    const candidates = generateCandidates("Matrix", [" devworks ", "devworks"], 10);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.label).toBe("Matrix Devworks");
  });
});
