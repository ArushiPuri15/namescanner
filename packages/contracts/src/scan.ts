import { z } from "zod";

export const nameStyleSchema = z.enum(["boring", "neutral", "creative"]);

export const probeIdSchema = z.enum(["domain", "web", "github"]);

export const scanConstraintsSchema = z.object({
  maxDomainPriceInr: z.number().int().positive().optional(),
  style: nameStyleSchema.default("boring"),
  maxCandidates: z.number().int().min(1).max(50).default(20),
});

export const scanLocaleSchema = z.object({
  country: z.string().length(2),
  region: z.string().optional(),
});

export const scanRequestSchema = z.object({
  seed: z.string().trim().min(1).max(64),
  locale: scanLocaleSchema,
  tlds: z.array(z.string().min(2).max(16)).min(1).max(10),
  suffixes: z.array(z.string().trim().min(1).max(32)).default([]),
  constraints: scanConstraintsSchema.default({}),
  probes: z.array(probeIdSchema).min(1).default(["domain", "web", "github"]),
});

export const probeStatusSchema = z.enum(["available", "taken", "unknown", "error"]);

export const domainPriceQuoteSchema = z.object({
  tld: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  periodYears: z.number().int().positive().default(1),
});

export const candidatePricingSchema = z.object({
  provider: z.string(),
  quotes: z.array(domainPriceQuoteSchema),
  cheapestInr: z.number().int().positive().optional(),
  withinBudget: z.boolean().optional(),
});

export const probeResultSchema = z.object({
  probe: probeIdSchema,
  provider: z.string(),
  status: probeStatusSchema,
  confidence: z.number().min(0).max(1),
  evidence: z.record(z.unknown()),
  checkedAt: z.string().datetime(),
  latencyMs: z.number().int().nonnegative(),
  error: z.string().optional(),
});

export const scoreBreakdownSchema = z.object({
  total: z.number().min(0).max(100),
  domain: z.number().min(0).max(100),
  collision: z.number().min(0).max(100),
  boringness: z.number().min(0).max(100),
});

export const candidateReportSchema = z.object({
  name: z.string(),
  domains: z.array(probeResultSchema),
  probes: z.array(probeResultSchema),
  pricing: candidatePricingSchema.optional(),
  score: scoreBreakdownSchema,
  risks: z.array(z.string()),
  actions: z.object({
    mcaSearchUrl: z.string().url().optional(),
    ipIndiaSearchUrl: z.string().url().optional(),
    googleSearchUrl: z.string().url().optional(),
  }),
});

export const scanMetaSchema = z.object({
  partialFailures: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  probesRun: z.array(probeIdSchema),
  pricingProvider: z.string().optional(),
});

export const scanReportSchema = z.object({
  scanId: z.string().uuid(),
  candidates: z.array(candidateReportSchema),
  meta: scanMetaSchema,
});

export type NameStyle = z.infer<typeof nameStyleSchema>;
export type ProbeId = z.infer<typeof probeIdSchema>;
export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type ProbeStatus = z.infer<typeof probeStatusSchema>;
export type DomainPriceQuote = z.infer<typeof domainPriceQuoteSchema>;
export type CandidatePricing = z.infer<typeof candidatePricingSchema>;
export type ProbeResult = z.infer<typeof probeResultSchema>;
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;
export type CandidateReport = z.infer<typeof candidateReportSchema>;
export type ScanMeta = z.infer<typeof scanMetaSchema>;
export type ScanReport = z.infer<typeof scanReportSchema>;
