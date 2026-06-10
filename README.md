# NameScanner

Probe-orchestration engine for evaluating business name candidates — domain availability, web collision, and registry links — with normalized scoring and graceful partial failures.

> **Session 3:** Real domain checks via RDAP in `PROBE_MODE=live`. Use `PROBE_MODE=stub` locally for fake data.

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

### Example scan (stub — no probes yet)

```bash
curl -s http://localhost:3001/v1/scans \
  -H 'content-type: application/json' \
  -d '{
    "seed": "Matrix",
    "locale": { "country": "IN" },
    "tlds": ["in", "co.in"],
    "suffixes": ["devworks", "softworks"]
  }' | jq
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
3. India MCA / IP India link builder
4. Registrar pricing (mock → Namecheap)
5. Web UI results table
6. Fly.io + Cloudflare Pages deploy
7. MCP server (v2)

## License

Private portfolio project.
