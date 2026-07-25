# Plan: Full Create/Edit Forms for All Entities

## Problem Summary

Every entity in the app either:

1. Has a create form that only asks for 0-1 fields and hardcodes the rest with placeholder data
2. Has no create form at all
3. Has no edit capability after creation

The UI interfaces also use display-layer property names (`owner`, `tier`, `classification`) that don't match the domain interfaces (`ownerUserId`, `riskTier`, `classification`), causing data shape mismatches.

## Issue Inventory

| # | Entity | File | Form Fields | Hardcoded | Edit? |
|---|--------|------|-------------|-----------|-------|
| 1 | ROPA Activity | `governance-panels.tsx:90` | 1 (name) | ~20 fields | No |
| 2 | Policy | `governance-panels.tsx:178` | 1 (title) | ~8 fields | No |
| 3 | AI System | `advanced-governance-panels.tsx:25` | **0** | ~15 fields | No |
| 4 | Information Asset | `advanced-governance-panels.tsx:68` | **0** | ~16 fields | No |
| 5 | Supplier Assessment | `supplier-panels.tsx:31` | **0** | ~13 fields | No |
| 6 | Assurance Risk | `assurance-panels.tsx:114` | **0** | ~12 fields | No |
| 7 | Matter | `igos-client.tsx:111` | 4 | ~6 (demo only) | No |
| 8 | Redaction | `redaction-workspace.tsx:36` | N/A | Hardcoded matter ID | No |
| 9 | Contract Governance | `advanced-governance-panels.tsx:152` | — | No create at all | No |
| 10 | Record Instance | `advanced-governance-panels.tsx:100` | — | No create at all | No |
| 11 | Audit Programme | `assurance-panels.tsx:162` | — | Button has no onClick | No |
| 12 | DPIA fallback | `governance-panels.tsx:36` | — | Hardcoded dummy sections | No |

Issues 3-6 are the most severe — the create handlers send objects with display-layer property names that don't match the domain interface, and the service layer doesn't run Zod validation on save for these entities, so mismatched/incomplete objects get persisted.

---

## Architecture Decisions

### Form pattern
Reuse the existing `.modal` + `.modal-backdrop` CSS (from matter create in `igos-client.tsx:220`). Already styled, consistent with the app, works well for 10-20 field forms.

### Edit flow
Table row click opens the same modal pre-filled with item data. Table rows already have `cursor:pointer` in CSS (`globals.css:20`).

### Shared component
Create `app/components/entity-form-modal.tsx` — a reusable modal shell + typed form field helpers. Avoids duplicating modal/backdrop/cancel/submit boilerplate across 11 forms.

### Array fields
Comma-separated text input, split on save. Simple, no new component dependencies.

### Date fields
Native `<input type="date">` stored as ISO datetime string.

### Validation
Client-side required-field checks before submission. Service-layer Zod validation stays as-is (already runs for ROPA, Policy, Supplier).

---

## Shared Component: `app/components/entity-form-modal.tsx`

A single file providing:

- `EntityFormModal<T>` — generic modal shell (backdrop, title, cancel, submit, loading state)
- `Field` — label + input wrapper (text, number, date)
- `Select` — label + `<select>` wrapper
- `Check` — checkbox + label
- `TextArea` — label + `<textarea>` wrapper
- `TagInput` — comma-separated text input, outputs `string[]`
- `Section` — `<fieldset>` with heading (for grouping fields within the modal)

All styled with existing `.modal` CSS classes. Minimal new CSS.

---

## Phase 1: Shared Component + AI System Form

**Worst offender — 0 form fields, 15 domain fields.**

### Files to create

- `app/components/entity-form-modal.tsx`

### Files to modify

- `app/advanced-governance-panels.tsx` — rewrite `AiGovernancePanel`

### AI System form fields

| Section | Fields |
|---------|--------|
| Core | `name*`, `purpose*` (textarea), `ownerUserId*`, `modelProvider*`, `modelReference*` |
| Risk & Compliance | `riskTier*` (select: prohibited/high/limited/minimal), `personalDataUsed*`, `specialCategoryDataUsed*`, `automatedDecisionSignificantEffect*` |
| Oversight | `humanOversightDescription*` (textarea), `explainabilityDescription*` (textarea), `monitoringMetrics*` (tag input) |
| Review | `reviewDueAt*` (date) |

Domain fields with defaults (not in form): `id` (auto), `matId` (from props), `status` (default `"proposed"`), `supplierId` (optional), `dpiaId` (optional), `supplierAssessmentId` (optional), `trainingDataDescription` (optional), `approvedByUserId` (optional), `approvalRationale` (optional)

### Edit flow

Click table row opens modal pre-filled, save updates via API.

---

## Phase 2: Information Asset Form

**0 form fields, 16 domain fields.**

### File to modify

- `app/advanced-governance-panels.tsx` — rewrite `AssetRegisterPanel`

### Asset form fields

| Section | Fields |
|---------|--------|
| Core | `name*`, `assetType*` (select: system/dataset/document-collection/physical-records/integration), `ownerUserId*` |
| Classification | `classification*` (select: public/internal/confidential/restricted), `criticality*` (select: low/medium/high/critical) |
| Data & Hosting | `containsPersonalData*`, `containsSpecialCategoryData*`, `hostingLocations*` (tag input) |
| Links | `ropaActivityIds*` (tag input), `dpiaIds*` (tag input), `supplierIds*` (tag input), `retentionRuleIds*` (tag input) |
| Recovery | `recoveryTimeHours` (number, required if restricted/critical), `recoveryPointHours` (number) |
| Review | `nextReviewAt*` (date), `status*` (select: active/under-review/retiring/retired) |

Domain defaults: `id` (auto), `matId`, `academyIds` (from context), `administratorUserId` (optional), `lastReviewedAt` (optional)

---

## Phase 3: Supplier Assessment Form

**0 form fields, 13 domain fields.**

### File to modify

- `app/supplier-panels.tsx` — rewrite `SupplierRegisterPanel`

### Supplier form fields

| Section | Fields |
|---------|--------|
| Core | `supplierName*`, `serviceDescription*` (textarea), `relationship*` (select: processor/joint-controller/independent-controller/subprocessor) |
| Security | `securityQuestionnaireStatus*` (select), `contractStatus*` (select), `dataProtectionTermsConfirmed*` |
| Risk | `riskRating*` (select: low/medium/high/critical), `internationalTransfers*`, `subprocessors*` (tag input), `certifications*` (tag input) |
| Review | `ownerUserId*`, `reviewDueAt*` (date), `status*` (select: draft/in-review/approved/suspended/offboarded) |

Conditional fields:

- If `internationalTransfers` = true → show `transferAssessmentId` (text)
- If risk is high/critical → show `residualRisksAcceptedByUserId` + `residualRiskRationale`

Domain defaults: `id`, `matId`, `breachNotificationHours` (optional)

---

## Phase 4: Assurance Risk Form

**0 form fields, 12 domain fields.**

### File to modify

- `app/assurance-panels.tsx` — rewrite `RiskRegisterPanel`

### Risk form fields

| Section | Fields |
|---------|--------|
| Core | `title*`, `description*` (textarea), `category*` (select: regulatory/privacy/information-security/records/supplier/operational) |
| Scoring | `likelihood*` (select 1-5), `impact*` (select 1-5), `controlEffectiveness*` (number 0-100) |
| Controls | `controls*` (tag input), `treatments*` (tag input), `appetite*` (select: low/medium/high/critical) |
| Review | `ownerUserId*`, `reviewDueAt*` (date), `status*` (select: open/treating/accepted/closed) |

Computed: inherent score = likelihood x impact, residual = inherent x (1 - controlEffectiveness/100), rating from `scoreAssuranceRisk()`.

Domain defaults: `id`, `matId`, `academyId` (optional), `acceptedByUserId` (optional), `acceptanceRationale` (optional)

---

## Phase 5: ROPA + Policy Form Improvements

### ROPA (`governance-panels.tsx`)

Replace the single-field inline form with a modal containing:

- `name*`
- `purpose*` (textarea)
- `lawfulBasis*` (select: consent/contract/legal-obligation/vital-interests/public-task/legitimate-interests)
- `dataSubjectCategories*` (tag input)
- `personalDataCategories*` (tag input)
- `specialCategoryData*` (checkbox)
- `criminalOffenceData*` (checkbox)
- `retentionRule*` (textarea)
- `securityMeasures*` (tag input)
- `sourceSystems*` (tag input)

Keep existing save logic, just add the missing fields.

### Policy (`governance-panels.tsx`)

Expand form to collect:

- `title*`
- `version*` (default "0.1")
- `reviewDueAt*` (date)

Keep existing save logic.

---

## Phase 6: Missing Create Flows + Audit Programme

### Contract Governance (`advanced-governance-panels.tsx`)

Add "New contract" button to `ContractGovernancePanel`.

Form fields: `title*`, `supplierId*`, `ownerUserId*`, `startsAt*` (date), `expiresAt*` (date), `renewalNoticeAt*` (date), `dataProcessingTerms*`, `confidentialityTerms*`, `auditRights*`, `subprocessorApprovalRequired*`, `breachNotificationHours` (number), `returnOrDeletionTerms*`

Status defaults to `"draft"`.

### Records Management (`advanced-governance-panels.tsx`)

Add "New retention rule" button to `RecordsManagementPanel`.

Form fields: `name*`, `recordCategory*`, `trigger*` (select: creation/closure/pupil-leaves/employment-ends/contract-ends/superseded), `periodMonths*` (number), `disposition*` (select: review/destroy/transfer-to-archive), `authority*`

### Audit Programme (`assurance-panels.tsx`)

Wire the existing "Plan audit" button (currently no onClick).

Form fields: `title*`, `scope*` (textarea), `leadAuditorUserId*`, `plannedStartAt*` (date), `plannedEndAt*` (date), `academyIds*` (tag input)

Status defaults to `"planned"`.

---

## Phase 7: Redaction + DPIA Fixes

### Redaction (`redaction-workspace.tsx`)

- Accept `matterId` prop instead of hardcoding `"SAR-2026-0178"` (line 36)
- Remove hardcoded fallback suggestions display header (line 71)

### DPIA (`governance-panels.tsx`)

- Remove hardcoded dummy sections fallback (lines 36-43) — show "No sections" empty state instead
- Remove hardcoded risk score display (line 67)

---

## Phase 8: Edit Flow for All Entities

Each panel's table/card row becomes clickable, opening the same modal pre-filled with item data.

Pattern:

```tsx
const [editing, setEditing] = useState<Entity | null>(null);

// In table:
<tr onClick={() => setEditing(item)}>

// Modal:
{editing !== null && (
  <EntityFormModal
    item={editing}
    onClose={() => setEditing(null)}
    onSave={handleSave}
  />
)}
```

Applies to: AI Systems, Assets, Suppliers, Risks, ROPA, Policy, Contracts, Records, Audit Programme.

---

## Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | Shared component | `app/components/entity-form-modal.tsx` |
| 2 | AI System form | `app/advanced-governance-panels.tsx` |
| 3 | Information Asset form | `app/advanced-governance-panels.tsx` |
| 4 | Supplier Assessment form | `app/supplier-panels.tsx` |
| 5 | Assurance Risk form | `app/assurance-panels.tsx` |
| 6 | ROPA form expansion | `app/governance-panels.tsx` |
| 7 | Policy form expansion | `app/governance-panels.tsx` |
| 8 | Contract Governance create | `app/advanced-governance-panels.tsx` |
| 9 | Records Management create | `app/advanced-governance-panels.tsx` |
| 10 | Audit Programme create | `app/assurance-panels.tsx` |
| 11 | Redaction + DPIA fixes | `app/redaction-workspace.tsx`, `app/governance-panels.tsx` |
| 12 | Wire edit flow for all panels | All panel files |
| 13 | Typecheck + tests + build | — |

---

## Files Modified (summary)

| File | Changes |
|------|---------|
| **NEW** `app/components/entity-form-modal.tsx` | Shared modal + form field components |
| `app/advanced-governance-panels.tsx` | Rewrite AI, Asset, Contract, Records panels with forms + edit |
| `app/assurance-panels.tsx` | Add Risk form, Audit Programme create, edit flows |
| `app/supplier-panels.tsx` | Add Supplier form + edit |
| `app/governance-panels.tsx` | Expand ROPA + Policy forms, fix DPIA fallback |
| `app/redaction-workspace.tsx` | Accept matterId prop, remove hardcoded data |
| `app/globals.css` | Minor additions only if needed (form sections, tag input styling) |

---

## Risks / Tradeoffs

- **Complexity:** ~11 form components. Mitigated by the shared `EntityFormModal` base.
- **Form length:** ROPA has 16 required fields. Mitigated by section grouping within the modal.
- **No new dependencies:** Using native HTML inputs, no form libraries.
- **Service layer:** Some services don't validate on save (AI, Asset, Records, Contracts). The forms will send complete objects, so this is fine for now. Adding Zod validation to those services is a follow-up task.
- **Matter form (issue 7):** Already has a functional form with 4 fields. Not included in this plan — the remaining hardcoded fields (owner, due, risk, progress) are demo-only display concerns, not domain data.
