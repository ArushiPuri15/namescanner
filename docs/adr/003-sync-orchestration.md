# ADR 003: Synchronous Orchestration in v1

## Status

Accepted — Session 1

## Context

A scan runs multiple probes per candidate. We need predictable latency for a portfolio demo without operating a job queue.

## Decision

- **`POST /v1/scans`** runs synchronously in v1
- Use **`Promise.allSettled`** for parallel probes per candidate
- Enforce **`PROBE_TIMEOUT_MS`** per adapter (default 3000)
- Return **`meta.partialFailures`** when probes error

## Consequences

**Positive**

- Simple mental model for API consumers
- No Redis/BullMQ in v1
- Partial failure is explicit in responses

**Negative**

- Large candidate lists × slow probes can exceed HTTP timeouts
- May need async jobs in v2 if trademark bulk search is added

## Revisit when

- p95 scan latency consistently exceeds 5 seconds, or
- we add probes slower than 2 seconds each at scale
