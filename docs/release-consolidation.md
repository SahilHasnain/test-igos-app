# IGOS release-candidate consolidation runbook

## Current release candidate

The complete feature stack is represented by commit `615c56d2da9509ab5847fc7259265295e3000b5d` plus the consolidation/security commits on `agent/igos-stage-4b-assets-records-ai`.

The PR chain is valid and must be merged in this order:

1. PR #1 `agent/igos-core-foundation` → `Appsuite`
2. PR #2 `agent/igos-stage-2-governance` → retarget to `Appsuite` after PR #1
3. PR #3 `agent/igos-stage-3-assurance` → retarget to `Appsuite` after PR #2
4. PR #4 `agent/igos-stage-4-advanced-governance` → retarget to `Appsuite` after PR #3
5. PR #5 `agent/igos-stage-4b-assets-records-ai` → retarget to `Appsuite` after PR #4

After each merge, verify the next PR diff contains only its intended stage and CI is green. Do not merge all PRs simultaneously and do not bypass branch protection.

## Merge prerequisites

All PRs remain draft until the following are evidenced:

- Appwrite development project is provisioned from schema version 7;
- persistent repository adapters exist for every schema resource used by the UI/API;
- MAT and academy isolation tests pass against Appwrite;
- backup and restoration rehearsal succeeds;
- dependency audit, typecheck, automated tests and production build pass;
- the application is deployed to a protected development hostname;
- DPO, security and product acceptance checks are recorded.

## Reproducible dependencies

`package-lock.json` is committed. CI uses `npm ci --ignore-scripts` and fails on high or critical npm audit findings.

The consolidation update moves Next.js to 16.2.11 and overrides affected transitive `postcss` and `sharp` versions. `npm audit` returned zero known vulnerabilities when the lockfile was generated. Any future dependency update must regenerate the lockfile, rerun the complete CI gate and receive security review.

Do not use `npm audit fix --force` in the release branch.

## Appwrite schema migration

Treat `infra/appwrite/schema.json` version 7 as the desired-state specification. Apply resources in this order:

1. MATs, academies and memberships
2. matters, workflows, documents and audit events
3. deadline adjustments and notification receipts
4. DPIA sections/risks, processing activities and policies
5. supplier and transfer assessments
6. assurance actions, audit programmes/findings, risks and evidence packs
7. redaction analysis, suggestions, second reviews and manifests
8. AI systems, information assets, retention rules, record instances, holds and contract governance
9. encrypted document bucket, indexes and server-only permissions

Migration must be additive in development. Never delete or rename an existing production attribute without an approved data migration and restoration point.

## Data bootstrap

Create the first MAT, academies and administrator through a controlled server-side script or Appwrite console session. Record generated IDs. Assign the administrator `mat-admin` and `dpo` roles. Verify academy-limited test users before importing live records.

Do not copy demonstration personal data into Appwrite.

## Deployment sequence

1. Create a database snapshot and deployment rollback point.
2. Deploy with `IGOS_DATA_MODE=demo` and integrations disabled.
3. Run health, navigation and static security checks.
4. Configure Appwrite secrets in the deployment secret store.
5. Run schema and permission validation.
6. Switch the development environment to `IGOS_DATA_MODE=appwrite`.
7. Execute smoke tests for authentication, cases, workflows, documents and audit events.
8. Test every role and academy boundary.
9. Exercise backup restoration in a separate environment.
10. Obtain acceptance before staging or production promotion.

## Rollback

If deployment acceptance fails:

- return traffic to the previous application image;
- restore `IGOS_DATA_MODE=demo` only in non-production environments;
- do not delete newly created Appwrite resources;
- preserve audit and incident evidence;
- restore data from the pre-migration snapshot only under the approved recovery procedure;
- document the failed control, affected records and corrective action.

Production must never fall back to browser-session demo storage for live personal data.

## Security acceptance gates

- penetration test and remediation
- dependency and software-composition analysis
- secret scanning and repository history review
- threat modelling for tenant isolation and document disclosure
- prompt-injection and data-exfiltration testing for AI review
- malware scanning and content-type verification for uploads
- encryption, key management and backup review
- rate limiting, session handling and security headers
- audit-log integrity and alerting
- disaster recovery and incident-response exercises

## Organisational acceptance

- IGOS DPIA approved
- privacy information approved
- retention schedule approved
- role matrix and segregation of duties approved
- AI/redaction operating procedure approved
- SAR/FOI/breach templates approved
- training completed for DPO, case managers and academy leads
- production support, ownership and escalation routes agreed

## Release decision

The release is eligible to merge only when every prerequisite has an owner, evidence reference and recorded approval. A green CI run alone is not production acceptance.
