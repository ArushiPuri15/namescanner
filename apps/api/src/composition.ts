import type { AvailabilityProbe, DomainPricingProvider } from "@namescanner/application";
import { BraveWebProbe } from "@namescanner/adapters-brave";
import { GodaddyDomainProbe } from "@namescanner/adapters-godaddy";
import { GithubHandleProbe } from "@namescanner/adapters-github";
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

function godaddyBaseUrl(env: AppEnv): string {
  return env.GODADDY_API_ENV === "production"
    ? "https://api.godaddy.com"
    : "https://api.ote-godaddy.com";
}

function hasGodaddyCredentials(env: AppEnv): boolean {
  return Boolean(env.GODADDY_API_KEY && env.GODADDY_API_SECRET);
}

function createDomainProbe(env: AppEnv): AvailabilityProbe {
  if (hasGodaddyCredentials(env)) {
    return new GodaddyDomainProbe({
      apiKey: env.GODADDY_API_KEY as string,
      apiSecret: env.GODADDY_API_SECRET as string,
      baseUrl: godaddyBaseUrl(env),
    });
  }

  return new RdapDomainProbe({
    baseUrl: env.RDAP_BASE_URL,
  });
}

function createRegistrarPricing(env: AppEnv): DomainPricingProvider | null {
  if (hasGodaddyCredentials(env)) {
    return null;
  }

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
    createDomainProbe(env),
    new GithubHandleProbe({
      apiToken: env.GITHUB_API_TOKEN,
    }),
  ];

  if (env.BRAVE_SEARCH_API_KEY) {
    probes.push(
      new BraveWebProbe({
        apiKey: env.BRAVE_SEARCH_API_KEY,
        baseUrl: env.BRAVE_SEARCH_BASE_URL,
      }),
    );
  } else {
    warnings.push("BRAVE_SEARCH_API_KEY is not set — web collision probe unavailable");
  }

  if (!env.GITHUB_API_TOKEN) {
    warnings.push(
      "GITHUB_API_TOKEN is not set — GitHub probe uses anonymous rate limits (60 req/hr)",
    );
  }

  if (hasGodaddyCredentials(env)) {
    if (env.GODADDY_API_ENV === "ote") {
      warnings.push("GoDaddy OTE sandbox — domain prices and availability are for testing only");
    }
  }

  const pricing = createRegistrarPricing(env);
  if (!pricing && !hasGodaddyCredentials(env)) {
    warnings.push("Registrar pricing is not configured — budget filters are unavailable");
  }

  return {
    mode: env.PROBE_MODE,
    probes,
    pricing,
    warnings,
  };
}
