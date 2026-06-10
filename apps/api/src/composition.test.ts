import { describe, expect, it } from "vitest";
import { GodaddyDomainProbe } from "@namescanner/adapters-godaddy";
import { loadEnv } from "@namescanner/config";
import { createProbeRegistry } from "./composition.js";

describe("createProbeRegistry", () => {
  it("uses stub probes in stub mode", () => {
    const registry = createProbeRegistry(loadEnv({ NODE_ENV: "test", PROBE_MODE: "stub" }));

    expect(registry.mode).toBe("stub");
    expect(registry.probes.map((probe) => probe.id)).toEqual(["domain", "web", "github"]);
    expect(registry.pricing?.id).toBe("stub-pricing");
  });

  it("registers RDAP domain probe in live mode", () => {
    const registry = createProbeRegistry(loadEnv({ NODE_ENV: "test", PROBE_MODE: "live" }));

    expect(registry.mode).toBe("live");
    expect(registry.probes.map((probe) => probe.id)).toEqual(["domain", "github"]);
    expect(registry.warnings.some((warning) => warning.includes("BRAVE_SEARCH_API_KEY"))).toBe(
      true,
    );
    expect(registry.warnings.some((warning) => warning.includes("GITHUB_API_TOKEN"))).toBe(true);
    expect(registry.pricing).toBeNull();
    expect(registry.warnings.some((warning) => warning.includes("Registrar pricing"))).toBe(true);
  });

  it("uses GoDaddy domain probe when credentials are configured", () => {
    const registry = createProbeRegistry(
      loadEnv({
        NODE_ENV: "test",
        PROBE_MODE: "live",
        GODADDY_API_KEY: "key",
        GODADDY_API_SECRET: "secret",
        GODADDY_API_ENV: "ote",
      }),
    );

    expect(registry.probes[0]).toBeInstanceOf(GodaddyDomainProbe);
    expect(registry.pricing).toBeNull();
    expect(registry.warnings.some((warning) => warning.includes("GoDaddy OTE"))).toBe(true);
  });

  it("registers Brave web probe when API key is configured", () => {
    const registry = createProbeRegistry(
      loadEnv({
        NODE_ENV: "test",
        PROBE_MODE: "live",
        BRAVE_SEARCH_API_KEY: "test-brave-key",
        GITHUB_API_TOKEN: "test-github-token",
      }),
    );

    expect(registry.probes.map((probe) => probe.id)).toEqual(["domain", "github", "web"]);
    expect(registry.warnings.some((warning) => warning.includes("BRAVE_SEARCH_API_KEY"))).toBe(
      false,
    );
    expect(registry.warnings.some((warning) => warning.includes("GITHUB_API_TOKEN"))).toBe(false);
  });
});
