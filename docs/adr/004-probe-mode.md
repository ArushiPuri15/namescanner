# ADR 004: Probe Mode (stub vs live)

## Status

Accepted — Session 2

## Context

NameScanner must run locally without API keys while production must not silently return fake availability data.

## Decision

- Add `PROBE_MODE` env: `stub` | `live` (default **`live`**)
- **stub:** `@namescanner/adapters-stub` simulates domain/web/github checks
- **live:** real adapters register in `apps/api/src/composition.ts` (RDAP, Brave in later sessions)
- `/ready` exposes `probeMode`, configured probes, and warnings
- API responses include top-level `warnings` when registry has caveats

## Consequences

**Positive**

- Local dev works with `PROBE_MODE=stub` in `.env`
- Production defaults to honest `live` mode (partial data until adapters ship)
- Stub-in-production emits explicit warning

**Negative**

- Operators must set env correctly on deploy

## Production checklist

```env
NODE_ENV=production
PROBE_MODE=live
BRAVE_SEARCH_API_KEY=...   # when web probe ships
WEB_ORIGIN=https://your-web-app.com
```
