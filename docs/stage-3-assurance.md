# Stage 3 — assurance and risk

## Scope

Stage 3 introduces Federation-wide remediation, audit, evidence and information-governance risk oversight. It is stacked on Stage 2 and does not require Microsoft 365.

## Delivered

- central actions with source linkage, ownership, priority, deadlines and escalation status;
- evidence-backed action closure with a mandatory rationale;
- audit programmes and rated findings;
- root-cause, recommendation, management-response and verification records;
- audit findings that cannot close without evidence and independent verification;
- information-governance risk register with inherent and residual scoring;
- explicit acceptance controls for high and critical residual risk;
- deterministic evidence-pack manifests with duplicate-evidence protection;
- academy assurance scores and RAG ratings;
- operational action, audit, risk and evidence dashboards;
- Appwrite schema version 5 resources.

## Dashboard methodology

Academy assurance scores combine statutory compliance (40%), policy compliance (30%) and training compliance (30%). The score is reduced for overdue critical actions, open high/critical findings and high/critical residual risks. RAG boundaries are green at 85 or above, amber from 70 to 84, and red below 70.

The score is a management indicator, not a legal conclusion. Underlying evidence and exceptions must remain visible.

## Appwrite resources

Version 5 adds `assurance-actions`, `audit-programmes`, `audit-findings`, `assurance-risks` and `evidence-packs`.

The Dev must implement persistent repositories and enforce MAT/academy scope server-side before enabling Appwrite mode. Evidence-pack files should be generated asynchronously, checksum-verified and stored in the protected evidence repository.

## Acceptance conditions

- academy users cannot access another academy's findings, risks or actions;
- auditors can review evidence but cannot silently modify management responses;
- actions cannot close without evidence and a closure rationale;
- findings cannot close until marked ready and independently verified;
- high residual risks require named acceptance and rationale;
- evidence-pack manifests change when evidence content or membership changes;
- scorecards trace every penalty to underlying records;
- all lifecycle decisions generate audit events;
- Microsoft 365 can be unavailable without affecting assurance functions.
