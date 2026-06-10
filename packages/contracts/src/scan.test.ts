import { describe, expect, it } from "vitest";
import { scanRequestSchema } from "./scan.js";

describe("scanRequestSchema", () => {
  it("accepts a minimal India-focused request", () => {
    const parsed = scanRequestSchema.parse({
      seed: "Matrix",
      locale: { country: "IN" },
      tlds: ["in", "co.in"],
      suffixes: ["devworks", "softworks"],
    });

    expect(parsed.constraints.style).toBe("boring");
    expect(parsed.probes).toEqual(["domain", "web", "github"]);
  });

  it("rejects an empty seed", () => {
    expect(() =>
      scanRequestSchema.parse({
        seed: "",
        locale: { country: "IN" },
        tlds: ["in"],
      }),
    ).toThrow();
  });
});
