# ADR 005: RDAP for Domain Availability

## Status

Accepted — Session 3

## Context

NameScanner needs real domain availability in production without registrar API keys on day one. RDAP (Registration Data Access Protocol) is the modern public standard for domain registration lookups.

## Decision

- Add `@namescanner/adapters-rdap` with `RdapDomainProbe`
- Query a public RDAP aggregator (`RDAP_BASE_URL`, default `https://rdap.cloud/api/v1`)
- Map HTTP status: **404 → available**, **2xx → taken**, other → unknown/error
- Check all requested TLDs in parallel per candidate
- Register probe only when `PROBE_MODE=live`

## Consequences

**Positive**

- Production domain checks without Namecheap API approval
- Free, no API key for RDAP reads
- Injectable `fetchFn` enables fast contract tests

**Negative**

- RDAP 404 semantics can vary slightly by registry — we document confidence scores
- Rate limits on public aggregators — may need caching (Session 5+)

## Alternatives considered

| Option | Rejected because |
|---|---|
| WHOIS port 43 | Unstructured text, harder to parse reliably |
| Namecheap only | Requires API approval before development unblocks |
| DNS lookup only | Domain can have DNS but be unregistered in edge cases |
