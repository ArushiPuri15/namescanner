# ADR 007: Brave Web and GitHub Handle Probes

## Status

Accepted — Session 5

## Context

Live mode had RDAP for domains but no real web collision or GitHub handle checks. Stub probes already modeled `web` and `github` probe IDs; production needed adapters that map external APIs into the shared `ProbeResult` shape.

## Decision

- Add `@namescanner/adapters-brave` with `BraveWebProbe`
  - Query Brave Web Search API (`BRAVE_SEARCH_API_KEY`)
  - Heuristic collision detection on top 5 results (token overlap + compact name match)
  - `supports()` returns false when API key is missing
- Add `@namescanner/adapters-github` with `GithubHandleProbe`
  - Check slugified candidate against GitHub REST `/users/{slug}` then `/orgs/{slug}`
  - 404 on both → available; 200 on either → taken
  - Optional `GITHUB_API_TOKEN` for higher rate limits
- Improve India registry action URLs to use site-scoped Google searches (MCA, IP India)

## Consequences

**Positive**

- Live scans can surface brand collision and GitHub namespace conflicts
- GitHub probe works without credentials (with rate-limit warning)
- Injectable `fetchFn` keeps contract tests fast and offline

**Negative**

- Brave collision heuristic can false-positive on generic words or false-negative on weak matches — confidence scores reflect this
- Anonymous GitHub API is limited to 60 requests/hour per IP

## Alternatives considered

| Option | Rejected because |
|---|---|
| Google Custom Search | Brave already planned; fewer moving parts to add a second search vendor |
| Scrape MCA/IP India directly | Fragile HTML parsing; link-out search is honest for v1 |
| Single “social” probe | GitHub and web collision have different APIs and semantics |
