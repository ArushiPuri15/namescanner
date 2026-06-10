# ADR 006: Registrar Pricing via Separate Port

## Status

Accepted — Session 4

## Context

Scans can include `constraints.maxDomainPriceInr`, but RDAP only answers availability — not registration cost. Namecheap exposes catalog pricing via `namecheap.users.getPricing`, which is a different concern from domain probes.

## Decision

- Add `DomainPricingProvider` port in `application` (not a probe)
- Fetch TLD registration prices once per scan and attach to every candidate report
- **Stub mode:** `StubDomainPricingProvider` returns fixed INR prices for local dev
- **Live mode:** `NamecheapPricingProvider` when `NAMECHEAP_*` env vars are set
- Convert USD quotes to INR using `USD_TO_INR_RATE` for budget checks in `domain`
- Cache Namecheap pricing in-memory per provider instance (catalog prices change slowly)

## Consequences

**Positive**

- Budget risks appear without coupling pricing to RDAP or availability probes
- Namecheap credentials remain optional — scans still work with RDAP-only live mode
- Injectable `fetchFn` and XML fixtures enable fast contract tests

**Negative**

- Catalog pricing ignores premium domains — `domains.check` would be needed for exact per-name quotes
- USD→INR conversion uses a configurable static rate, not live FX

## Alternatives considered

| Option | Rejected because |
|---|---|
| Pricing as a probe (`probe: "pricing"`) | Pricing is per-TLD catalog data, not per-candidate availability |
| Embed prices in domain probe evidence | Mixes RDAP availability with registrar billing APIs |
| Hard-require Namecheap in live mode | Blocks production domain checks before API approval |
