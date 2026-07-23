# IGOS Stage 1 — deployment and Dev handover

## Handover position

Branch: `agent/igos-core-foundation`  
Target: `Appsuite`  
Pull request: `#1` (keep as draft until environment acceptance is complete)

The branch is designed to run without Microsoft 365. `IGOS_DATA_MODE=demo` is the safe placeholder mode; `appwrite` is the persistent mode.

## What is implemented

- responsive operations dashboard and regulatory registers;
- SAR, FOI, breach and DPIA workflows;
- MAT and academy-scoped authorisation;
- SAR calendar-month, FOI working-day and breach 72-hour deadline calculations;
- controlled deadline extension and pause records;
- validated SAR, FOI and breach intake schemas;
- append-only, hash-linked audit events;
- provider-neutral notification service with MAT-scoped idempotency;
- Appwrite repository and storage boundaries;
- role-aware demo controls and accessibility foundations;
- automated domain, service, authorisation, audit and workflow tests.

## Dev actions

### 1. Prepare the development environment

- Use Node.js 24 or later.
- Copy `.env.example` to `.env.local`.
- Keep `IGOS_DATA_MODE=demo` initially.
- Run `npm install --ignore-scripts`, `npm run typecheck`, `npm test` and `npm run build`.

### 2. Provision Appwrite

Follow `docs/appwrite-setup.md` and `infra/appwrite/schema.json` version 2. Create every table, column, index and the encrypted document bucket with the exact declared identifiers.

Put `APPWRITE_API_KEY` only in the deployment secret store. Do not expose it through a `NEXT_PUBLIC_` variable or commit it.

### 3. Add persistence adapters introduced by hardening

Implement Appwrite repositories for:

- `deadline-adjustments`;
- `notification-receipts`.

Repositories must enforce MAT and academy scope server-side. Notification receipt lookup must use both `matId` and `idempotencyKey` so one MAT cannot suppress another MAT's delivery.

### 4. Connect the interface

Replace browser-session demonstration mutations with the existing matter and workflow APIs. Keep optimistic version checks and show a recoverable conflict message if another user changes a record.

The visible role selector is demonstration-only. In persistent mode, derive roles and academy access from the authenticated Appwrite membership; never trust a role supplied by the browser.

### 5. Configure notifications

Choose one adapter per environment. SMTP can be the initial provider. Microsoft 365 may be added later through the same adapter interface but must remain optional.

Add retry and dead-letter processing outside the request-response path. Preserve idempotency keys across retries. Do not include special-category or detailed case data in email bodies by default; send a secure case link.

### 6. Environment acceptance

Verify all of the following before changing the PR from draft:

- DPO and MAT administrator can see Federation-wide records;
- academy lead sees only assigned academies;
- auditor cannot create or advance a matter;
- read-only user cannot mutate data;
- cross-MAT reads and writes fail;
- SAR month-end deadlines clamp correctly;
- breach deadlines cannot be paused;
- SAR extensions require an approval record and cannot exceed two additional months;
- FOI clarification pauses record start, resumption and rationale;
- duplicate notification idempotency keys result in one send;
- audit events link to the preceding event for the same matter;
- Microsoft 365 being disabled does not affect login, cases, documents or reports;
- document upload, checksum, quarantine and compensating deletion work;
- backup restoration is tested in a non-production environment.

### 7. Security and operational acceptance

Before live personal data is used, complete:

- penetration testing and dependency review;
- retention schedule and disposal-job approval;
- privacy notice and acceptable-use review;
- DPO approval of permissions and notification templates;
- backup, restoration and incident-response exercises;
- production monitoring, alerting and audit-log retention;
- DPIA for IGOS itself.

## Merge decision

Merge PR #1 only after CI is green, development deployment is accessible, the acceptance checks are evidenced and material findings are resolved. Create a separate branch for Stage 2 modules after the merge; do not mix deployment secrets or environment-specific identifiers into source control.
