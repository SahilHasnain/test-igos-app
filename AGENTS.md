# AGENTS.md

## Project

IGOS — UK Multi-Academy Trust information governance platform. Next.js 16 + TypeScript 5.9 + Appwrite.

Two data modes: `IGOS_DATA_MODE=demo` (in-memory, no DB) and `IGOS_DATA_MODE=appwrite` (real Appwrite). Runtime switch is in `src/services/runtime.ts`.

## Appwrite MCP Servers

Two MCP servers configured globally in `~/.config/opencode/opencode.jsonc`:

| Server | URL | When to use |
|--------|-----|-------------|
| `appwrite` (API) | `https://mcp.appwrite.io/` | Provision collections, CRUD documents, manage storage/users, verify schema, seed data |
| `appwrite-docs` | `https://mcp-for-docs.appwrite.io` | SDK usage questions, API reference, code examples, best practices |

**Use API MCP when:** you need to interact with the live Appwrite project — create tables, query documents, test repository adapters, verify provisioned schema matches `infra/appwrite/schema.json`.

**Use Docs MCP when:** you need to understand Appwrite SDK methods, figure out query syntax, check API limits, or find implementation patterns for `src/appwrite/*.ts` adapters.

**Do NOT use MCP for:** domain logic (`src/domain/`), service layer (`src/services/`), or UI (`app/`). These are Appwrite-agnostic.

## Quick Commands

```bash
npm run dev          # Next.js dev server (port 3000)
npm run typecheck    # tsc --noEmit
npm test             # vitest run (tests/**/*.test.ts)
npm run build        # next build
npm run provision    # Create Appwrite collections from infra/appwrite/schema.json
npm run seed         # Seed demo data into Appwrite
npm run test:e2e     # Playwright (demo mode, chromium)
npm run test:e2e:appwrite  # Playwright against live Appwrite
```

## CI Gate (must all pass)

```bash
npm audit --audit-level=high
npm run typecheck
npm test
npm run build
```

Run these in order before any PR. CI runs on `ubuntu-latest` with Node 24.

## Testing

- Unit/integration: `tests/**/*.test.ts` via Vitest. Run single: `npx vitest run tests/authorisation.test.ts`
- E2E: `e2e/*.spec.ts` via Playwright. Demo mode auto-starts dev server on port 3001. Appwrite mode on port 3002 (requires `IGOS_DATA_MODE=appwrite` and running Appwrite instance).
- E2E helpers in `e2e/helpers.ts` handle login for both modes. Appwrite test password: `Change-Me-2026!`.

## Architecture

```
src/domain/       — Types, authorisation, workflow rules, deadlines (pure, no deps)
src/services/     — Business logic (uses repositories)
src/repositories/ — Repository interfaces
src/appwrite/     — Appwrite implementations of repositories
src/demo/         — In-memory demo implementations
src/auth/         — JWT verification, membership resolution
src/config/       — Env validation (Zod)
app/              — Next.js App Router pages + API routes
app/api/          — REST API (matters, workflows, governance, assurance, redaction)
infra/appwrite/   — Schema, provision, seed scripts
```

Runtime switching: `createRuntimeXxxService()` functions in `src/services/runtime.ts` check `IGOS_DATA_MODE` and return demo or Appwrite implementations.

## Environment

- `.env.example` lists all required variables. Copy to `.env.local`.
- `IGOS_DATA_MODE=demo` requires no Appwrite. All other vars still need valid-looking values (env validation runs at import time).
- Appwrite mode needs: endpoint, project ID, API key, and 33 table IDs + 1 bucket ID.
- Microsoft 365 / Google Workspace integrations are optional toggles (`INTEGRATION_*_ENABLED=false`).

## Appwrite Schema

- 33 tables defined in `infra/appwrite/schema.json` (version 7).
- Provision: `npm run provision` (runs `npx tsx infra/appwrite/provision.ts`).
- Fix after provision: `npm run fix-provision`.
- Verify: `npx tsx infra/appwrite/verify-provision.ts`.

## Conventions

- Path alias: `@/*` maps to project root.
- No `allowJs`. Strict mode. ESM only.
- Zod for env validation (`src/config/env.ts`).
- Domain logic is pure — no Appwrite imports in `src/domain/`.
- Every API route lives under `app/api/` and uses `createRuntimeXxxService()`.
- Audit trail is immutable — never expose delete/edit on audit events.

## Gotchas

- `npm run build` fails if env vars are invalid even in demo mode — env schema validates eagerly.
- E2E tests spin up their own dev server. Don't run `npm run dev` separately during E2E.
- Appwrite E2E is serial (`workers: 1`, `retries: 1`). Demo E2E is parallel (`workers: 6`).
- PR merge order matters: #1 → #2 → #3 → #4 → #5 into `Appsuite` branch.
- Do NOT redesign domain controls — 13 domain files are complete and tested.
