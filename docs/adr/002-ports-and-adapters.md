# ADR 002: Ports and Adapters (Hexagonal)

## Status

Accepted — Session 1

## Context

NameScanner integrates multiple third-party systems (RDAP, Brave Search, registrars, GitHub). Tight coupling would make testing fragile and swaps expensive.

## Decision

- Define **`AvailabilityProbe`** port in `@namescanner/application`
- Implement each external system in **`packages/adapters-*`**
- Wire dependencies only in **`apps/api`** (composition root)
- Normalize all probe output to **`ProbeResult`** (`@namescanner/contracts`)

## Consequences

**Positive**

- Unit tests use stub probes (see `run-name-scan.test.ts`)
- Contract tests per adapter with JSON fixtures
- CTO-readable separation of policy vs plumbing

**Negative**

- More packages than a single `services/` folder
- Composition root must stay thin

## Non-goals

- No adapter imports Hono or React
- No fetch calls inside `runNameScan`
