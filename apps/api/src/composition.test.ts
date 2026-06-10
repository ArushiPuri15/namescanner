import { describe, expect, it } from "vitest";
import { loadEnv } from "@namescanner/config";
import { createProbeRegistry } from "./composition.js";

describe("createProbeRegistry", () => {
  it("uses stub probes in stub mode", () => {
    const registry = createProbeRegistry(loadEnv({ NODE_ENV: "test", PROBE_MODE: "stub" }));

    expect(registry.mode).toBe("stub");
    expect(registry.probes.map((probe) => probe.id)).toEqual(["domain", "web", "github"]);
  });

  it("registers RDAP domain probe in live mode", () => {
    const registry = createProbeRegistry(loadEnv({ NODE_ENV: "test", PROBE_MODE: "live" }));

    expect(registry.mode).toBe("live");
    expect(registry.probes.map((probe) => probe.id)).toEqual(["domain"]);
    expect(registry.warnings.some((warning) => warning.includes("BRAVE_SEARCH_API_KEY"))).toBe(
      true,
    );
  });
});
