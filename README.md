# IGOS — Information Governance Operating System

IGOS is a provider-neutral information governance platform for multi-academy trusts.

## Principles

- The core platform operates without Microsoft 365, Google Workspace or another external productivity suite.
- Appwrite provides application data, storage, authentication, teams and workflow infrastructure.
- External services are optional adapters and can be connected or removed without interrupting core case management.
- Every access decision is scoped to a MAT and, where applicable, an academy.
- Material case activity is recorded as append-only audit events.

## Stage 1

This branch establishes the production foundation: Next.js, TypeScript, Appwrite boundaries, tenancy, authorisation, statutory deadline calculation, integration ports and automated tests.

See [Architecture](docs/architecture.md) for the design.
