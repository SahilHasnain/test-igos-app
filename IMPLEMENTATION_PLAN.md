# IGOS Implementation Plan

## Objective

Complete environment-specific engineering to provision the development Appwrite project, implement persistence adapters, replace demo data with API-backed records, and deploy to the development environment.

## Constraints

- Merge PRs sequentially: #1 → #2 → #3 → #4 → #5
- Do NOT merge until dev environment passes acceptance checks
- Do NOT redesign domain controls
- Do NOT make Microsoft 365 mandatory

---

## Phase 1: Environment Setup & Provisioning

### Task 1.1: Create Appwrite Provisioning Script

**File**: `infra/appwrite/provision.ts`

Automate Appwrite project setup from `schema.json`:
- Create database `igos-core`
- Create all 33 tables with exact IDs
- Create columns with correct types, lengths, required flags
- Create indexes as specified
- Create `case-documents` bucket (25MB limit, encryption, antivirus)
- Set server-only permissions (no client-side write access)

### Task 1.2: Create Data Bootstrap Script

**File**: `infra/appwrite/seed.ts`

Create initial MAT, academies, and admin user:
- Create first MAT record (status: active)
- Create academy records linked to MAT
- Create admin user membership with `mat-admin` and `dpo` roles
- Record all generated IDs
- No demonstration personal data

---

## Phase 2: Appwrite Repository Adapters

### Task 2.1: Core Repositories (PR #1 scope)

| Repository | File | Schema Table |
|------------|------|--------------|
| Workflow | `src/appwrite/workflow-repository.ts` | `matters` |
| Deadline Adjustments | `src/appwrite/deadline-adjustment-repository.ts` | `deadline-adjustments` |
| Notification Receipts | `src/appwrite/notification-receipt-repository.ts` | `notification-receipts` |

**Pattern** (from `matter-repository.ts`):
```typescript
export class AppwriteXxxRepository implements XxxRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}
  // Methods with MAT+academy scope filtering
}
```

### Task 2.2: Governance Repositories (PR #2 scope)

| Repository | File | Schema Tables |
|------------|------|---------------|
| DPIA | `src/appwrite/dpia-repository.ts` | `dpia-sections`, `dpia-risks` |
| ROPA | `src/appwrite/ropa-repository.ts` | `processing-activities` |
| Policy | `src/appwrite/policy-repository.ts` | `policies`, `policy-acknowledgements`, `policy-exceptions` |
| Supplier | `src/appwrite/supplier-repository.ts` | `supplier-assessments`, `transfer-assessments` |

### Task 2.3: Assurance Repositories (PR #3 scope)

| Repository | File | Schema Table |
|------------|------|--------------|
| Assurance Actions | `src/appwrite/assurance-action-repository.ts` | `assurance-actions` |
| Audit Programmes | `src/appwrite/audit-programme-repository.ts` | `audit-programmes` |
| Audit Findings | `src/appwrite/audit-finding-repository.ts` | `audit-findings` |
| Assurance Risks | `src/appwrite/assurance-risk-repository.ts` | `assurance-risks` |
| Evidence Packs | `src/appwrite/evidence-pack-repository.ts` | `evidence-packs` |

### Task 2.4: Redaction Repositories (PR #4 scope)

| Repository | File | Schema Table |
|------------|------|--------------|
| Redaction Analysis | `src/appwrite/redaction-analysis-repository.ts` | `redaction-analysis-runs` |
| Redaction Suggestions | `src/appwrite/redaction-suggestion-repository.ts` | `redaction-suggestions` |
| Second Reviews | `src/appwrite/second-review-repository.ts` | `redaction-second-reviews` |
| Redaction Manifests | `src/appwrite/redaction-manifest-repository.ts` | `redaction-manifests` |

### Task 2.5: Advanced Governance Repositories (PR #5 scope)

| Repository | File | Schema Table |
|------------|------|--------------|
| AI Systems | `src/appwrite/ai-system-repository.ts` | `ai-systems` |
| Information Assets | `src/appwrite/information-asset-repository.ts` | `information-assets` |
| Retention Rules | `src/appwrite/retention-rule-repository.ts` | `retention-rules` |
| Record Instances | `src/appwrite/record-instance-repository.ts` | `record-instances` |
| Records Holds | `src/appwrite/records-hold-repository.ts` | `records-holds` |
| Contract Governance | `src/appwrite/contract-governance-repository.ts` | `contract-governance` |

---

## Phase 3: Service Wiring & Runtime Configuration

### Task 3.1: Update Environment Schema

**File**: `src/config/env.ts`

Add table ID variables for all new repositories:
```
APPWRITE_DPIA_SECTIONS_TABLE_ID
APPWRITE_DPIA_RISKS_TABLE_ID
APPWRITE_PROCESSING_ACTIVITIES_TABLE_ID
APPWRITE_POLICIES_TABLE_ID
APPWRITE_POLICY_ACKNOWLEDGEMENTS_TABLE_ID
APPWRITE_POLICY_EXCEPTIONS_TABLE_ID
APPWRITE_SUPPLIER_ASSESSMENTS_TABLE_ID
APPWRITE_TRANSFER_ASSESSMENTS_TABLE_ID
APPWRITE_ASSURANCE_ACTIONS_TABLE_ID
APPWRITE_AUDIT_PROGRAMMES_TABLE_ID
APPWRITE_AUDIT_FINDINGS_TABLE_ID
APPWRITE_ASSURANCE_RISKS_TABLE_ID
APPWRITE_EVIDENCE_PACKS_TABLE_ID
APPWRITE_REDACTION_ANALYSIS_TABLE_ID
APPWRITE_REDACTION_SUGGESTIONS_TABLE_ID
APPWRITE_SECOND_REVIEWS_TABLE_ID
APPWRITE_REDACTION_MANIFESTS_TABLE_ID
APPWRITE_AI_SYSTEMS_TABLE_ID
APPWRITE_INFORMATION_ASSETS_TABLE_ID
APPWRITE_RETENTION_RULES_TABLE_ID
APPWRITE_RECORD_INSTANCES_TABLE_ID
APPWRITE_RECORDS_HOLDS_TABLE_ID
APPWRITE_CONTRACT_GOVERNANCE_TABLE_ID
APPWRITE_DEADLINE_ADJUSTMENTS_TABLE_ID
APPWRITE_NOTIFICATION_RECEIPTS_TABLE_ID
APPWRITE_WORKFLOWS_TABLE_ID
```

### Task 3.2: Create Appwrite Service Factories

**File**: `src/appwrite/services.ts`

Add factories:
- `createWorkflowService()`
- `createGovernanceServices()` → `{ dpia, ropa, policy }`
- `createAssuranceServices()` → `{ actions, programmes, findings, risks, evidence }`
- `createRedactionServices()` → `{ analysis, suggestions, reviews, manifests }`
- `createAdvancedGovernanceServices()` → `{ aiSystems, assets, retention, records, holds, contracts }`

### Task 3.3: Update Runtime Switch

**File**: `src/services/runtime.ts`

Remove demo-only throws, wire Appwrite repositories:
```typescript
// Before
if(dataMode()!=="demo") throw new Error(...)

// After
return dataMode()==="demo" ? demoService : createAppwriteXxxService()
```

### Task 3.4: Update Governance Runtime

**File**: `src/services/governance-runtime.ts`

Remove `ensureSupported()` throw, wire Appwrite repositories.

---

## Phase 4: UI Integration (Replace Demo Data)

### Task 4.1: Create API Client

**File**: `src/client/api-client.ts`

Browser-side API calls with JWT authentication. CRUD for all entities following existing API route patterns.

### Task 4.2: Refactor UI Components

**Files**: All `app/*.tsx` panel components

Replace `useState` with hardcoded data → `useEffect` + API calls:
```typescript
// Before
const [matters, setMatters] = useState(initialMatters);

// After
const [matters, setMatters] = useState([]);
useEffect(() => {
  apiClient.listMatters(scope).then(setMatters);
}, [scope]);
```

### Task 4.3: Remove Demo Role Selector

**File**: `app/igos-client.tsx`

Remove `<RoleSelector>` component. Replace with authenticated user context from JWT.

### Task 4.4: Implement Authentication Flow

**File**: `app/login/page.tsx` (new)

Appwrite email/password or OAuth login. Integrate Appwrite Account SDK for JWT generation.

---

## Phase 5: Authorization & Tenancy

### Task 5.1: Update Membership Resolution

**File**: `src/auth/appwrite-context.ts`

Already implemented. Verify academy-scoped access filtering works correctly.

### Task 5.2: Add Authorization Tests

**File**: `tests/authorization-integration.test.ts`

Test cases:
- MAT admin can see all records in their MAT
- Academy lead sees only assigned academies
- Cross-MAT reads fail
- Role-based capability enforcement

---

## Phase 6: Storage & Security Configuration

### Task 6.1: Configure Appwrite Storage

Bucket: `case-documents`
- 25MB limit
- Encryption enabled
- Antivirus enabled
- Server-only permissions

### Task 6.2: Document Permission Model

**File**: `src/appwrite/document-store.ts`

Add academy-scoped read permissions via server-side queries. Verify antivirus scanning passes before marking document active.

### Task 6.3: Document Lifecycle

- **Upload flow**: Upload → AV scan → Metadata write → Status: active
- **Quarantine flow**: AV fail → Status: quarantined → Manual review
- **Disposal flow**: Check holds → Check retention → Delete file + metadata

---

## Phase 7: Background Jobs & Notifications

### Task 7.1: Implement Job Runner

**File**: `src/jobs/runner.ts` (new)

Options:
1. Appwrite Functions: Schedule via cron trigger
2. External worker: BullMQ + Redis
3. Simple interval: Node.js `setInterval` for development

### Task 7.2: Wire Deadline Scanner

**File**: `src/jobs/deadline-scan.ts`

Add: Database query → scan → send notifications.

### Task 7.3: Wire Governance Reminders

**File**: `src/jobs/governance-reminders.ts`

Add: Query review items → scan → send reminders.

### Task 7.4: Implement Disposal Processing

**File**: `src/jobs/disposal-processor.ts` (new)

Logic: Check eligible records → Verify no holds → Execute disposal → Record evidence.

### Task 7.5: Configure Notification Adapter

**File**: `src/integrations/smtp-adapter.ts` (new)

Implement SMTP email delivery via `nodemailer`. Alternative: `src/integrations/webhook-adapter.ts` for HTTP notifications.

---

## Phase 8: Backup & Restoration

### Task 8.1: Create Backup Script

**File**: `infra/backup/backup.sh`

Export database collections and storage buckets.

### Task 8.2: Create Restoration Script

**File**: `infra/backup/restore.sh`

Import from backup snapshot and verify data integrity.

### Task 8.3: Document Procedure

**File**: `docs/backup-restoration.md`

Include schedule, retention, testing frequency.

---

## Phase 9: Testing

### Task 9.1: MAT & Academy Isolation Tests

**File**: `tests/integration/tenancy.test.ts`

Tests:
- User A (MAT 1, Academy 1) cannot see MAT 2 data
- User A cannot see MAT 1, Academy 2 data (if not assigned)
- Cross-MAT write attempts fail
- Audit events capture cross-MAT access attempts

### Task 9.2: Role-Based Access Tests

**File**: `tests/integration/roles.test.ts`

Test each of 8 roles:
- `platform-admin`: Can access all MATs
- `mat-admin`: Full access within MAT
- `dpo`: Full access + approve DPIA
- `case-manager`: Create/update matters
- `academy-lead`: Read-only for assigned academies
- `contributor`: Update specific matters assigned
- `auditor`: Read-only audit access
- `read-only`: No mutations

### Task 9.3: Document Upload & AV Scan Tests

**File**: `tests/integration/documents.test.ts`

Tests:
- Upload succeeds, metadata created
- AV scan trigger works
- Quarantine on detection
- Compensating deletion on metadata failure

### Task 9.4: Backup Restoration Test

**File**: `tests/integration/backup.test.ts`

Tests:
- Backup completes successfully
- Restoration recovers all data
- Application functions correctly after restore

---

## Phase 10: Deployment

### Task 10.1: Create Dockerfile

**File**: `Dockerfile`

Base: Node.js 24. Multi-stage build. Include health check.

### Task 10.2: Create docker-compose.yml

**File**: `docker-compose.yml`

Services: IGOS app, Appwrite (if self-hosted), Redis (optional for job queue).

### Task 10.3: Configure Coolify Deployment

**File**: `coolify.json` or deployment docs

Environment variables from `.env.example`. Secrets: APPWRITE_API_KEY.

### Task 10.4: Deployment Checklist

- [ ] Appwrite project provisioned
- [ ] Schema applied
- [ ] Seed data created
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Health checks passing

---

## Phase 11: Acceptance Testing

### Task 11.1: Execute Acceptance Checks

From `docs/dev-handover.md`:

- [ ] DPO and MAT admin can see Federation-wide records
- [ ] Academy lead sees only assigned academies
- [ ] Auditor cannot create or advance a matter
- [ ] Read-only user cannot mutate data
- [ ] Cross-MAT reads and writes fail
- [ ] SAR month-end deadlines clamp correctly
- [ ] Breach deadlines cannot be paused
- [ ] SAR extensions require approval, max +2 months
- [ ] FOI clarification pauses record correctly
- [ ] Duplicate notification idempotency works
- [ ] Audit events link to preceding event
- [ ] Microsoft 365 disabled doesn't affect core
- [ ] Document upload, checksum, quarantine work
- [ ] Backup restoration tested

---

## Merge Order (Sequential)

```
PR #1: Core Foundation
  ├─ Merge to Appsuite
  ├─ Verify CI green
  └─ Deploy to dev

PR #2: Governance
  ├─ Retarget to Appsuite
  ├─ Merge
  └─ Deploy to dev

PR #3: Assurance & Risk
  ├─ Retarget to Appsuite
  ├─ Merge
  └─ Deploy to dev

PR #4: AI Redaction
  ├─ Retarget to Appsuite
  ├─ Merge
  └─ Deploy to dev

PR #5: Advanced Governance
  ├─ Retarget to Appsuite
  ├─ Merge
  └─ Deploy to dev (final)
```

**Do NOT merge until dev environment passes acceptance checks.**

---

## File Structure After Implementation

```
src/
├── appwrite/
│   ├── server.ts (existing)
│   ├── matter-repository.ts (existing)
│   ├── audit-repository.ts (existing)
│   ├── document-store.ts (existing)
│   ├── workflow-repository.ts (NEW)
│   ├── deadline-adjustment-repository.ts (NEW)
│   ├── notification-receipt-repository.ts (NEW)
│   ├── dpia-repository.ts (NEW)
│   ├── ropa-repository.ts (NEW)
│   ├── policy-repository.ts (NEW)
│   ├── supplier-repository.ts (NEW)
│   ├── assurance-action-repository.ts (NEW)
│   ├── audit-programme-repository.ts (NEW)
│   ├── audit-finding-repository.ts (NEW)
│   ├── assurance-risk-repository.ts (NEW)
│   ├── evidence-pack-repository.ts (NEW)
│   ├── redaction-analysis-repository.ts (NEW)
│   ├── redaction-suggestion-repository.ts (NEW)
│   ├── second-review-repository.ts (NEW)
│   ├── redaction-manifest-repository.ts (NEW)
│   ├── ai-system-repository.ts (NEW)
│   ├── information-asset-repository.ts (NEW)
│   ├── retention-rule-repository.ts (NEW)
│   ├── record-instance-repository.ts (NEW)
│   ├── records-hold-repository.ts (NEW)
│   ├── contract-governance-repository.ts (NEW)
│   ├── mappers.ts (existing, expand)
│   └── services.ts (existing, expand)
├── client/
│   └── api-client.ts (NEW)
├── jobs/
│   ├── deadline-scan.ts (existing)
│   ├── governance-reminders.ts (existing)
│   ├── runner.ts (NEW)
│   └── disposal-processor.ts (NEW)
└── integrations/
    ├── smtp-adapter.ts (NEW)
    └── webhook-adapter.ts (NEW)
```

---

## Estimated Effort

| Phase | Tasks | Estimated Days |
|-------|-------|----------------|
| 1. Environment Setup | 2 | 1-2 |
| 2. Appwrite Adapters | 22 repos | 5-7 |
| 3. Service Wiring | 4 | 2-3 |
| 4. UI Integration | 4 | 3-4 |
| 5. Authorization | 2 | 1-2 |
| 6. Storage & Security | 3 | 2-3 |
| 7. Background Jobs | 5 | 3-4 |
| 8. Backup & Restoration | 3 | 1-2 |
| 9. Testing | 4 | 3-4 |
| 10. Deployment | 4 | 2-3 |
| 11. Acceptance Testing | 1 | 2-3 |
| **Total** | **~55 tasks** | **25-35 days** |
