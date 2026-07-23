# Security model

## Trust boundaries

IGOS treats the browser, optional provider webhooks and file uploads as untrusted. Privileged Appwrite credentials exist only in server-side deployment secrets.

## Tenant isolation

Every service receives an authenticated request context and explicit tenant scope. Authorisation is evaluated before repository access. Repository queries must always include matId and must include academyId where the membership is academy-limited.

## Documents

Uploads are allow-listed by MIME type, size-limited and hashed before storage. Production deployments must enable malware scanning and quarantine. Downloads require the same scope and capability checks as the parent matter.

## Audit

Audit events are append-only and hash chained per matter. Production exports should be written to immutable retention storage. Audit reads are restricted to DPO, MAT administration and auditor roles.

## Integrations

Provider credentials are isolated per MAT, encrypted and never exposed to the core domain. Adapters are disabled by default. Provider failure must not block native casework.
