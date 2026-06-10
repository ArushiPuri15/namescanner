import { describe, expect, it } from "vitest";
import { aggregateScore, scoreBoringness } from "./scoring.js";

describe("scoreBoringness", () => {
  it("rewards conventional IT suffixes", () => {
    expect(scoreBoringness("Matrix Devworks")).toBe(90);
    expect(scoreBoringness("Matrix Softworks")).toBe(90);
  });

  it("scores two-word names moderately", () => {
    expect(scoreBoringness("Matrix Labs")).toBe(70);
  });
});

describe("aggregateScore", () => {
  it("weights domain availability highest", () => {
    const highDomain = aggregateScore({ domain: 100, collision: 0, boringness: 0 });
    const highCollision = aggregateScore({ domain: 0, collision: 100, boringness: 0 });

    expect(highDomain.total).toBeGreaterThan(highCollision.total);
  });
});
