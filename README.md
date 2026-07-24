# IGOS — Information Governance Operating System

IGOS is a provider-neutral information governance platform for multi-academy trusts.

## Principles

- The core platform operates without Microsoft 365, Google Workspace or another external productivity suite.
- Appwrite provides application data, storage, authentication, teams and workflow infrastructure when persistent mode is enabled.
- External services are optional adapters and can be connected or removed without interrupting core case management.
- Every access decision is scoped to a MAT and, where applicable, an academy.
- Material case activity is recorded as append-only audit events.

## Stage 1

The current branch provides:

- a responsive Federation operations dashboard;
- SAR, FOI, personal-data-breach and DPIA registers;
- academy filtering and cross-register search;
- matter intake, case detail, task, document and audit views;
- controlled workflow progression;
- Appwrite persistence boundaries and MAT/academy authorisation;
- statutory deadline calculation and escalation scanning;
- automated type, service, workflow and production-build validation.

## Stage 2 governance foundation

The stacked Stage 2 branch adds multi-party DPIA controls, Article 30 ROPA validation and policy lifecycle governance. See [Stage 2 governance](docs/stage-2-governance.md).

## Stage 3 assurance foundation

The stacked Stage 3 branch adds central actions, audit findings, risk treatment, evidence packs and academy assurance scorecards. See [Stage 3 assurance](docs/stage-3-assurance.md).

## Stage 4 AI-assisted review

The stacked Stage 4 branch adds matter-aware SAR/FOI document review, human-controlled redaction decisions and disclosure manifests. See [AI-assisted redaction](docs/ai-redaction.md).

## Run locally

The default `demo` mode needs no external services:

```bash
cp .env.example .env.local
npm install --ignore-scripts
npm run dev
```

Open `http://localhost:3000`. Demo records are session-based and are not suitable for live personal data.

## Activate Appwrite

Keep `IGOS_DATA_MODE=demo` until the Appwrite project, resource schema, secrets and first MAT membership have been configured. Follow the [Appwrite activation guide](docs/appwrite-setup.md), then set `IGOS_DATA_MODE=appwrite` in the deployment environment.

Microsoft 365 remains optional and is disabled by default.

## Design and assurance

- [Architecture](docs/architecture.md)
- [Security model](docs/security-model.md)
- [Appwrite activation](docs/appwrite-setup.md)
- [Appwrite resource schema](infra/appwrite/schema.json)
- [Deployment and Dev handover](docs/dev-handover.md)
- [Stage 2 governance](docs/stage-2-governance.md)
- [Stage 3 assurance](docs/stage-3-assurance.md)
- [AI-assisted redaction](docs/ai-redaction.md)
