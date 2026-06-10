import { describe, expect, it } from "vitest";
import { loadEnv } from "@namescanner/config";
import { createApp } from "./app.js";

describe("createApp", () => {
  it("returns health status", async () => {
    const app = createApp(loadEnv({ NODE_ENV: "test", PROBE_MODE: "stub" }));
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  it("reports probe registry on ready", async () => {
    const app = createApp(loadEnv({ NODE_ENV: "test", PROBE_MODE: "stub" }));
    const response = await app.request("/ready");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.probeMode).toBe("stub");
    expect(body.probesConfigured).toEqual(["domain", "web", "github"]);
  });

  it("validates scan requests", async () => {
    const app = createApp(loadEnv({ NODE_ENV: "test", PROBE_MODE: "stub" }));
    const response = await app.request("/v1/scans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ seed: "" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns ranked candidates with scores in stub mode", async () => {
    const app = createApp(loadEnv({ NODE_ENV: "test", PROBE_MODE: "stub" }));
    const response = await app.request("/v1/scans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        seed: "Matrix",
        locale: { country: "IN" },
        tlds: ["in", "co.in"],
        suffixes: ["devworks", "infotech"],
        probes: ["domain", "web", "github"],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.candidates).toHaveLength(2);
    expect(body.candidates[0].name).toBe("Matrix Devworks");
    expect(body.candidates[0].score.total).toBeGreaterThan(body.candidates[1].score.total);
    expect(body.candidates[0].actions.mcaSearchUrl).toContain("mca.gov.in");
  });
});
