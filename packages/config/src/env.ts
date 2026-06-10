import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  PROBE_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  CACHE_TTL_DOMAIN_SEC: z.coerce.number().int().positive().default(600),
  /**
   * stub — simulated probes (local dev / demos; never use blindly in production)
   * live  — real external adapters when configured (default for production)
   */
  PROBE_MODE: z.enum(["stub", "live"]).default("live"),
  RDAP_BASE_URL: z.string().url().default("https://rdap.cloud/api/v1"),
  BRAVE_SEARCH_API_KEY: z.string().optional(),
  BRAVE_SEARCH_BASE_URL: z
    .string()
    .url()
    .default("https://api.search.brave.com/res/v1/web/search"),
  GITHUB_API_TOKEN: z.string().optional(),
  GODADDY_API_KEY: z.string().optional(),
  GODADDY_API_SECRET: z.string().optional(),
  /** ote = sandbox (api.ote-godaddy.com), production = api.godaddy.com */
  GODADDY_API_ENV: z.enum(["ote", "production"]).default("ote"),
  NAMECHEAP_API_USER: z.string().optional(),
  NAMECHEAP_API_KEY: z.string().optional(),
  NAMECHEAP_CLIENT_IP: z.string().optional(),
  NAMECHEAP_SANDBOX: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  /** Used when registrar quotes are returned in USD */
  USD_TO_INR_RATE: z.coerce.number().positive().default(83),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
