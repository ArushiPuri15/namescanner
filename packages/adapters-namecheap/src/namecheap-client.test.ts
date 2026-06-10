import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fetchRegisterPricing, parseRegisterPricing } from "./namecheap-client.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");
const fixtureXml = readFileSync(join(fixtureDir, "get-pricing-register.xml"), "utf8");

describe("parseRegisterPricing", () => {
  it("extracts 1-year REGISTER prices for requested TLDs", () => {
    const quotes = parseRegisterPricing(fixtureXml, ["com", "in", "co.in", "net"]);

    expect(quotes).toEqual([
      { tld: "com", amount: 9.18, currency: "USD", periodYears: 1 },
      { tld: "in", amount: 7.98, currency: "USD", periodYears: 1 },
      { tld: "co.in", amount: 6.98, currency: "USD", periodYears: 1 },
    ]);
  });
});

describe("fetchRegisterPricing", () => {
  it("calls the Namecheap API and parses the response", async () => {
    const requestedUrl: string[] = [];

    const quotes = await fetchRegisterPricing(["in"], {
      apiUser: "demo",
      apiKey: "secret",
      clientIp: "127.0.0.1",
      sandbox: true,
      fetchFn: async (input) => {
        requestedUrl.push(String(input));
        return new Response(fixtureXml, { status: 200 });
      },
    });

    expect(requestedUrl[0]).toContain("api.sandbox.namecheap.com");
    expect(requestedUrl[0]).toContain("namecheap.users.getPricing");
    expect(quotes).toEqual([{ tld: "in", amount: 7.98, currency: "USD", periodYears: 1 }]);
  });
});
