import { describe, expect, it } from "vitest";
import { createStubProbeSuite } from "./stub-probes.js";

const baseRequest = {
  seed: "Matrix",
  locale: { country: "IN" },
  tlds: ["in", "co.in"],
  suffixes: ["devworks", "infotech"],
  constraints: { style: "boring" as const, maxCandidates: 20 },
  probes: ["domain", "web", "github"] as const,
};

const context = {
  request: {
    ...baseRequest,
    probes: [...baseRequest.probes],
  },
  timeoutMs: 3000,
};

describe("createStubProbeSuite", () => {
  it("marks crowded suffixes as taken on domain and web probes", async () => {
    const probes = createStubProbeSuite();
    const infotech = { label: "Matrix Infotech", seed: "Matrix", suffix: "Infotech" };
    const devworks = { label: "Matrix Devworks", seed: "Matrix", suffix: "Devworks" };

    const infotechDomain = await probes[0]?.check(infotech, context);
    const devworksDomain = await probes[0]?.check(devworks, context);
    const infotechWeb = await probes[1]?.check(infotech, context);
    const devworksWeb = await probes[1]?.check(devworks, context);

    expect(infotechDomain?.status).toBe("taken");
    expect(devworksDomain?.status).toBe("available");
    expect(infotechWeb?.status).toBe("taken");
    expect(devworksWeb?.status).toBe("available");
  });
});
