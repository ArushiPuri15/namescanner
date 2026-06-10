import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  aggregateGodaddyStatuses,
  checkDomainsBulk,
  extractTldFromFqdn,
  microUnitsToAmount,
} from "./godaddy-client.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");
const fixture = JSON.parse(
  readFileSync(join(fixtureDir, "available-bulk-response.json"), "utf8"),
);

describe("microUnitsToAmount", () => {
  it("converts GoDaddy micro-units to dollars", () => {
    expect(microUnitsToAmount(14_990_000)).toBe(14.99);
  });
});

describe("extractTldFromFqdn", () => {
  it("handles multi-part Indian TLDs", () => {
    expect(extractTldFromFqdn("matrixdevworks.co.in", "matrixdevworks")).toBe("co.in");
    expect(extractTldFromFqdn("matrixdevworks.in", "matrixdevworks")).toBe("in");
  });
});

describe("aggregateGodaddyStatuses", () => {
  it("marks aggregate as taken when any domain is unavailable", () => {
    expect(
      aggregateGodaddyStatuses([
        { available: true },
        { available: false },
      ]),
    ).toBe("taken");
  });
});

describe("checkDomainsBulk", () => {
  it("posts domains to GoDaddy with sso-key auth", async () => {
    let authHeader = "";

    const results = await checkDomainsBulk(["matrixdevworks.in"], {
      apiKey: "key",
      apiSecret: "secret",
      baseUrl: "https://api.ote-godaddy.com",
      fetchFn: async (_input, init) => {
        authHeader = String(new Headers(init?.headers).get("Authorization"));
        return new Response(JSON.stringify(fixture), { status: 200 });
      },
    });

    expect(authHeader).toBe("sso-key key:secret");
    expect(results[0]?.amount).toBe(14.99);
    expect(results[1]?.available).toBe(false);
  });
});
