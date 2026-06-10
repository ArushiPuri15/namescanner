import { describe, expect, it } from "vitest";
import { aggregateDomainStatuses, lookupDomain } from "./rdap-client.js";

describe("lookupDomain", () => {
  it("maps RDAP 404 to available", async () => {
    const result = await lookupDomain("matrixdevworks.in", {
      baseUrl: "https://rdap.test/api/v1",
      fetchFn: async () => new Response(null, { status: 404 }),
    });

    expect(result.status).toBe("available");
    expect(result.httpStatus).toBe(404);
  });

  it("maps RDAP 200 to taken", async () => {
    const result = await lookupDomain("matrixinfotech.com", {
      baseUrl: "https://rdap.test/api/v1",
      fetchFn: async () =>
        new Response(JSON.stringify({ ldhName: "matrixinfotech.com" }), { status: 200 }),
    });

    expect(result.status).toBe("taken");
  });
});

describe("aggregateDomainStatuses", () => {
  it("marks taken if any TLD is registered", () => {
    const status = aggregateDomainStatuses([
      { fqdn: "a.in", status: "available", httpStatus: 404, source: "rdap" },
      { fqdn: "a.com", status: "taken", httpStatus: 200, source: "rdap" },
    ]);

    expect(status).toBe("taken");
  });

  it("marks available only when all TLDs are free", () => {
    const status = aggregateDomainStatuses([
      { fqdn: "a.in", status: "available", httpStatus: 404, source: "rdap" },
      { fqdn: "a.co.in", status: "available", httpStatus: 404, source: "rdap" },
    ]);

    expect(status).toBe("available");
  });
});
