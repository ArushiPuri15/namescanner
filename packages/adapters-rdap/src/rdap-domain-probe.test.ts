import { describe, expect, it } from "vitest";
import { RdapDomainProbe } from "./rdap-domain-probe.js";

const context = {
  request: {
    seed: "Matrix",
    locale: { country: "IN" },
    tlds: ["in", "co.in"],
    suffixes: ["devworks"],
    constraints: { style: "boring" as const, maxCandidates: 20 },
    probes: ["domain" as const],
  },
  timeoutMs: 3000,
};

describe("RdapDomainProbe", () => {
  it("checks each requested TLD via RDAP", async () => {
    const requested: string[] = [];
    const probe = new RdapDomainProbe({
      baseUrl: "https://rdap.test/api/v1",
      fetchFn: async (input) => {
        requested.push(String(input));
        return new Response(null, { status: 404 });
      },
    });

    const result = await probe.check(
      { label: "Matrix Devworks", seed: "Matrix", suffix: "devworks" },
      context,
    );

    expect(result.status).toBe("available");
    expect(result.provider).toBe("rdap");
    expect(requested).toHaveLength(2);
    expect(requested.some((url) => url.includes("matrixdevworks.in"))).toBe(true);
    expect(requested.some((url) => url.includes("matrixdevworks.co.in"))).toBe(true);
  });
});
