# Stage 4B — advanced governance

## Purpose

Stage 4B completes the planned feature scope with AI governance, the Information Asset Register, records management and contract obligations. It is stacked on the Stage 4 redaction branch and remains provider-neutral.

## AI governance

The AI register records purpose, owner, supplier, model reference, data use, risk tier, human oversight, explainability, DPIA, supplier assessment, monitoring and review dates.

Prohibited uses cannot be approved. High-risk uses require a linked DPIA, supplier assessment and monitoring metrics. Pilot and production approval require a named approver and rationale.

## Information Asset Register

Assets cover systems, datasets, document collections, physical records and integrations. Records include owner, classification, criticality, hosting, recovery objectives and links to ROPA, DPIAs, suppliers and retention rules.

Restricted or critical assets require recovery objectives. Assets containing special-category data require ROPA linkage.

## Records management

Retention rules define category, trigger, period, disposition and authority. Month-end calculations clamp to the final valid day rather than rolling into a later month.

Legal, SAR, FOI, investigation, audit and regulatory holds override disposal eligibility. A hold must be expressly released with reviewer and rationale before affected records can proceed. Disposal evidence remains linked to the record instance.

## Contract governance

Contract records track commencement, expiry, renewal notice, data-processing terms, confidentiality, audit rights, subprocessors, breach-notification commitments and data return/deletion.

Approval requires the mandatory information-governance terms and a breach-notification commitment of 72 hours or less. Supplier offboarding cannot complete without deletion evidence.

## Appwrite schema

Schema version 7 adds `ai-systems`, `information-assets`, `retention-rules`, `record-instances`, `records-holds` and `contract-governance`.

## Operational acceptance

Before persistent production use, confirm:

- academy scope is enforced for information assets and record instances;
- AI approval is limited to authorised DPO/MAT roles;
- prohibited AI uses cannot be overridden through the browser;
- holds prevent background disposal jobs from selecting records;
- hold release, disposal approval and destruction evidence create audit events;
- retention rules are versioned and historical calculations remain reproducible;
- contract expiry and renewal reminders are idempotent;
- supplier termination records data return/deletion evidence;
- Microsoft 365 being disabled has no effect on these modules.

## Consolidation boundary

No further feature branch should be opened after Stage 4B until the stacked PRs have been consolidated. The next programme phase is persistent Appwrite adapters, deployment, migration rehearsal, security testing and organisational acceptance.
