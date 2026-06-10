# ADR 001: Monorepo and Node 22 Runtime

## Status

Accepted — Session 1

## Context

NameScanner is a portfolio project that must demonstrate modular architecture without operational overhead. We need shared TypeScript types across API, probes, and UI.

## Decision

- Use a **pnpm workspace monorepo** orchestrated by **Turborepo**
- Target **Node 22 LTS** for the API process
- Split **`apps/api`** (Hono) and **`apps/web`** (Vite + React)

## Consequences

**Positive**

- Shared `@namescanner/contracts` prevents schema drift
- Turbo caches package builds in CI later
- Node 22 is widely deployable (Fly.io, Railway)

**Negative**

- More folders than a single-app repo
- Requires discipline to keep `domain` free of infrastructure imports

## Alternatives considered

| Option | Rejected because |
|---|---|
| Bun runtime | Smaller hiring/deploy familiarity vs Node |
| Next.js full-stack | Blurs API/UI boundaries; heavier than needed |
| Single package | Harder to demonstrate ports/adapters |
