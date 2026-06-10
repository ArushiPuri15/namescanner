import { Hono } from "hono";
import { cors } from "hono/cors";
import { scanReportSchema, scanRequestSchema } from "@namescanner/contracts";
import { runNameScan } from "@namescanner/application";
import type { AppEnv } from "@namescanner/config";
import { createProbeRegistry } from "./composition.js";

export function createApp(env: AppEnv) {
  const app = new Hono();
  const registry = createProbeRegistry(env);

  app.use(
    "*",
    cors({
      origin: env.WEB_ORIGIN,
    }),
  );

  app.get("/health", (c) =>
    c.json({
      status: "ok",
      uptimeSec: Math.floor(process.uptime()),
    }),
  );

  app.get("/ready", (c) =>
    c.json({
      status: "ready",
      probeMode: registry.mode,
      probesConfigured: registry.probes.map((probe) => probe.id),
      pricingProvider: registry.pricing?.id ?? null,
      warnings: registry.warnings,
    }),
  );

  app.post("/v1/scans", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }

    const parsed = scanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "invalid_request", details: parsed.error.flatten() }, 400);
    }

    const report = await runNameScan({
      request: parsed.data,
      probes: registry.probes,
      pricing: registry.pricing,
      usdToInrRate: env.USD_TO_INR_RATE,
      timeoutMs: env.PROBE_TIMEOUT_MS,
    });

    const validated = scanReportSchema.safeParse(report);
    if (!validated.success) {
      console.error("scan_report_validation_failed", validated.error.flatten());
      return c.json({ error: "internal_error" }, 500);
    }

    return c.json({
      ...validated.data,
      warnings: registry.warnings,
    });
  });

  return app;
}
