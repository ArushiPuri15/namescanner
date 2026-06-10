import { loadEnvFile } from "node:process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { loadEnv } from "@namescanner/config";
import { createApp } from "./app.js";

// Monorepo root `.env` (apps/api/src → ../../..)
const envPath = join(dirname(fileURLToPath(import.meta.url)), "../../..", ".env");
try {
  loadEnvFile(envPath);
} catch {
  // Optional in tests and production (platform env vars)
}

const env = loadEnv();
const app = createApp(env);

serve(
  {
    fetch: app.fetch,
    port: env.API_PORT,
  },
  (info) => {
    console.log(`namescanner api listening on http://localhost:${info.port}`);
  },
);
