# Appwrite activation guide

IGOS runs in `demo` mode without Appwrite. Use this guide when a dedicated Appwrite project is available.

## 1. Create an isolated project

Create a separate Appwrite project for each environment (`development`, `test`, `production`). Do not reuse a production project for development. Record the endpoint and project ID.

Add the deployed IGOS hostname as a Web platform. For local development, add `localhost` separately.

## 2. Create the core resources

Use [`infra/appwrite/schema.json`](../infra/appwrite/schema.json) as the controlled resource specification. Create:

- the `igos-core` database;
- `mats`, `academies`, `memberships`, `matters`, `audit-events` and `documents` tables;
- every declared column and index;
- the encrypted `case-documents` bucket with a 25 MB file limit and antivirus scanning.

Table and bucket identifiers must match the schema exactly. Client-side public create, update and delete permissions must not be granted. IGOS applies MAT and academy authorisation through its server services.

## 3. Create the server API key

Create a least-privilege API key for the IGOS server. Grant only the database, table-row, storage and user/session scopes required by the deployed services.

Store the key in the deployment platform's secret store. Never put it in a `NEXT_PUBLIC_` variable, commit it to Git or expose it to the browser.

## 4. Configure the environment

Copy `.env.example` into the deployment platform and replace placeholder values:

```dotenv
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://appwrite.example.org/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=igos
APPWRITE_API_KEY=<deployment-secret>
APPWRITE_DATABASE_ID=igos-core
APPWRITE_CASES_TABLE_ID=matters
APPWRITE_AUDIT_TABLE_ID=audit-events
APPWRITE_MEMBERSHIPS_TABLE_ID=memberships
APPWRITE_DOCUMENTS_TABLE_ID=documents
APPWRITE_DOCUMENTS_BUCKET_ID=case-documents
IGOS_BASE_URL=https://igos.example.org
IGOS_DATA_MODE=appwrite
INTEGRATION_MICROSOFT_365_ENABLED=false
INTEGRATION_GOOGLE_WORKSPACE_ENABLED=false
```

Microsoft 365 and Google Workspace remain optional. Leave both feature flags set to `false` unless an integration has been separately configured and approved.

## 5. Seed the first MAT administrator

Create the first Appwrite user, then add:

1. a row in `mats` with `status=active`;
2. the Federation's academies in `academies` using the MAT row ID;
3. a row in `memberships` linking the Appwrite user ID to the MAT ID;
4. the `mat-admin` and `dpo` roles, with `status=active`.

Use stable generated IDs and do not use academy names as security identifiers.

## 6. Acceptance checks

Before production use, confirm that:

- an authenticated MAT administrator can list and create matters;
- an academy-scoped user sees only authorised academy records;
- a user from another MAT cannot read, update or infer a matter;
- workflow advancement creates an audit event;
- document upload stores both the file and its checksum metadata;
- a failed metadata write removes the corresponding uploaded file;
- statutory deadline calculation and escalation jobs use the Europe/London business calendar;
- Microsoft 365 being unavailable does not affect core case management;
- `/api/health` reports a healthy application without disclosing secrets.

Run the repository validation gate after configuration:

```bash
npm install --ignore-scripts
npm run typecheck
npm test
npm run build
```

## Production boundary

Moving to `IGOS_DATA_MODE=appwrite` activates persistent records, but it is not by itself production approval. Production launch still requires organisation-specific retention rules, privacy information, role assignments, backup and restoration testing, incident procedures, penetration testing and DPO/security acceptance.
