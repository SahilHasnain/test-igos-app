# Known Issues

## DpiaProgressPanel matterId mismatch

**File**: `app/governance-panels.tsx:19`

`DpiaProgressPanel` calls `api.governance.dpia.get(matId, matId)` where:
- First arg `matId` — MAT scope (correct)
- Second arg `matterId` — also receives MAT scope (incorrect)

The API endpoint `GET /api/governance/dpia/[matterId]?matId=...` expects a specific **matter ID** (e.g. `DPIA-2026-0041`) as the URL param, but the panel has no concept of which individual matter to show DPIA sections for. It receives only `matId` (the MAT trust scope) as a prop.

**Impact**: In Appwrite mode the request will authenticate correctly but may return empty results since no specific matter is targeted. In demo mode it returns fallback placeholder data.

**Fix needed**: Either pass the selected matter ID as a second prop to governance panels, or change the DPIA endpoint to support fetching all DPIA sections for a MAT scope.
