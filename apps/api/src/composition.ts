import type { AvailabilityProbe } from "@namescanner/application";
import { RdapDomainProbe } from "@namescanner/adapters-rdap";
import { createStubProbeSuite } from "@namescanner/adapters-stub";
import type { AppEnv } from "@namescanner/config";

export type ProbeRegistry = {
  probes: AvailabilityProbe[];
  mode: AppEnv["PROBE_MODE"];
  warnings: string[];
};

/**
 * Composition root: selects probe implementations from environment.
 * Register new adapters here (RDAP, Brave, GitHub, etc.).
 */
export function createProbeRegistry(env: AppEnv): ProbeRegistry {
  const warnings: string[] = [];

  if (env.PROBE_MODE === "stub") {
    if (env.NODE_ENV === "production") {
      warnings.push("PROBE_MODE=stub in production returns simulated availability data");
    }

    return {
      mode: env.PROBE_MODE,
      probes: createStubProbeSuite(),
      warnings,
    };
  }

  const probes: AvailabilityProbe[] = [
    new RdapDomainProbe({
      baseUrl: env.RDAP_BASE_URL,
    }),
  ];

  if (!env.BRAVE_SEARCH_API_KEY) {
    warnings.push("BRAVE_SEARCH_API_KEY is not set — web collision probe unavailable");
  }

  if (!env.NAMECHEAP_API_USER) {
    warnings.push("Registrar pricing is not configured — budget filters use RDAP only");
  }

  return {
    mode: env.PROBE_MODE,
    probes,
    warnings,
  };
}
