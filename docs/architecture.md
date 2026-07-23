# IGOS Stage 1 Architecture

## Objective
A secure provider-neutral information governance core for multi-academy trusts. A MAT can run IGOS without Microsoft 365, Google Workspace or another productivity suite.

## Components
1. Next.js and TypeScript web application.
2. Appwrite authentication, teams, database, storage, functions and realtime.
3. SAR, FOI, breach, DPIA, ROPA, policy, action and audit domain rules.
4. Provider-independent identity, messaging and document ports.
5. Optional Microsoft 365, Google Workspace, SMTP and webhook adapters.

## Tenancy and authorisation
Every record has a non-null MAT identifier. Academy records also have an academy identifier. Access requires capability and scope matches. Appwrite server keys bypass permissions, so privileged SDK calls require a prior service-layer authorisation decision.

## Audit integrity
Material changes produce append-only audit events containing actor, scope, correlation ID, payload hash and previous-event hash. Production retention should use immutable or write-once storage.

## Documents
Appwrite Storage is the default evidence repository. External publication or synchronisation occurs only through an enabled adapter.

## Next milestone
Implement Appwrite schema and migrations, authenticated MAT context, SAR/FOI/breach services, upload controls, deadline jobs and end-to-end tests.
