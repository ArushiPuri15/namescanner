import type { AvailabilityProbe, DomainPricingProvider } from "@namescanner/application";
import { NamecheapPricingProvider } from "@namescanner/adapters-namecheap";
import { RdapDomainProbe } from "@namescanner/adapters-rdap";
import {
  StubDomainPricingProvider,
  createStubProbeSuite,
} from "@namescanner/adapters-stub";
import type { AppEnv } from "@namescanner/config";

export type ProbeRegistry = {
  probes: AvailabilityProbe[];
  pricing: DomainPricingProvider | null;
  mode: AppEnv["PROBE_MODE"];
  warnings: string[];
};

function createNamecheapPricing(env: AppEnv): DomainPricingProvider | null {
  if (!env.NAMECHEAP_API_USER || !env.NAMECHEAP_API_KEY || !env.NAMECHEAP_CLIENT_IP) {
    return null;
  }

  return new NamecheapPricingProvider({
    apiUser: env.NAMECHEAP_API_USER,
    apiKey: env.NAMECHEAP_API_KEY,
    clientIp: env.NAMECHEAP_CLIENT_IP,
    sandbox: env.NAMECHEAP_SANDBOX,
  });
}

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
      pricing: new StubDomainPricingProvider(),
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

  const pricing = createNamecheapPricing(env);
  if (!pricing) {
    warnings.push("Registrar pricing is not configured — budget filters are unavailable");
  }

  return {
    mode: env.PROBE_MODE,
    probes,
    pricing,
    warnings,
  };
}
