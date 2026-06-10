# NameScanner

Probe-orchestration engine for evaluating business name candidates — domain availability, web collision, and registry links — with normalized scoring and graceful partial failures.

> **Session 4:** Registrar pricing via `DomainPricingProvider` — mock INR prices in `PROBE_MODE=stub`, Namecheap catalog pricing in live mode when configured.

## Stack

- **Runtime:** Node 22
- **Monorepo:** pnpm workspaces + Turborepo
- **API:** Hono (`apps/api`)
- **Web:** Vite + React (`apps/web`)
- **Contracts:** Zod (`packages/contracts`)
- **Lint/format:** Biome

## Structure

```
apps/
  api/          # HTTP transport + composition (adapters wired in Session 7)
  web/          # Thin UI
packages/
  contracts/    # API schemas
  domain/       # Pure business logic
  application/  # Use cases + ports
  config/       # Typed env
docs/
  architecture.md
  adr/
```

See [docs/architecture.md](./docs/architecture.md) for boundaries and the probe extension guide.

## Prerequisites

- Node 22 (`nvm use`)
- pnpm 10 (`corepack enable`)

## Setup

```bash
cp .env.example .env
pnpm install
pnpm build
pnpm test
```

## Development

```bash
pnpm dev
```

- API: http://localhost:3001/health
- Web: http://localhost:5173

### Example scan (stub mode)

```bash
# Set PROBE_MODE=stub in .env for local dev
curl -s http://localhost:3001/v1/scans \
  -H 'content-type: application/json' \
  -d '{
    "seed": "Matrix",
    "locale": { "country": "IN" },
    "tlds": ["in", "co.in"],
    "suffixes": ["devworks", "softworks"],
    "constraints": { "maxDomainPriceInr": 800 },
    "probes": ["domain"]
  }' | jq '.candidates[0].pricing, .candidates[0].risks'
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start api + web in watch mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run Vitest across packages |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | Biome check |

## Roadmap

1. Brave web collision adapter
2. GitHub handle probe
3. Web UI results table
4. Fly.io + Cloudflare Pages deploy
5. MCP server (v2)

## License

Private portfolio project.
