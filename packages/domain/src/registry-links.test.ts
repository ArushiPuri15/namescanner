import { describe, expect, it } from "vitest";
import { buildRegistryActions, slugifyForDomain } from "./registry-links.js";

describe("registry links", () => {
  it("slugifies business names for domains", () => {
    expect(slugifyForDomain("Matrix Devworks")).toBe("matrixdevworks");
  });

  it("builds India-specific registry actions", () => {
    const actions = buildRegistryActions("Matrix Devworks", { country: "IN" });

    expect(actions.mcaSearchUrl).toContain("mca.gov.in");
    expect(actions.ipIndiaSearchUrl).toContain("ipindiaonline.gov.in");
    expect(actions.googleSearchUrl).toContain(encodeURIComponent("Matrix Devworks"));
  });
});
