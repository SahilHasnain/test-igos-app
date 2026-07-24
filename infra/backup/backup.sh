#!/usr/bin/env bash
set -euo pipefail

# IGOS Appwrite backup script
# Exports all database collections and storage buckets to a timestamped snapshot directory.
#
# Usage:
#   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... APPWRITE_DATABASE_ID=... ./infra/backup/backup.sh [snapshot_dir]
#
# Requires: node-appwrite (npx tsx) or Appwrite CLI

SNAPSHOT_DIR="${1:-backups/$(date +%Y%m%d-%H%M%S)}"
mkdir -p "$SNAPSHOT_DIR"

if [ -z "${APPWRITE_ENDPOINT:-}" ] || [ -z "${APPWRITE_PROJECT_ID:-}" ] || [ -z "${APPWRITE_API_KEY:-}" ] || [ -z "${APPWRITE_DATABASE_ID:-}" ]; then
  echo "Error: Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID"
  exit 1
fi

echo "=== IGOS Backup ==="
echo "Snapshot: $SNAPSHOT_DIR"
echo "Database: $APPWRITE_DATABASE_ID"
echo ""

TABLES=(
  mats academies memberships cases workflows
  deadline-adjustments notification-receipts
  dpia-sections dpia-risks processing-activities
  policies policy-acknowledgements policy-exceptions
  supplier-assessments transfer-assessments
  assurance-actions audit-programmes audit-findings assurance-risks evidence-packs
  redaction-analysis-runs redaction-suggestions redaction-second-reviews redaction-manifests
  ai-systems information-assets retention-rules record-instances records-holds contract-governance
)

echo "Exporting ${#TABLES[@]} collections..."

for table in "${TABLES[@]}"; do
  echo -n "  $table... "
  npx tsx -e "
    import { Client, Databases, Query } from 'node-appwrite';
    import { writeFileSync } from 'fs';

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const db = new Databases(client);
    const dbId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = '$table';
    const all = [];
    let cursor;
    do {
      const queries = [Query.limit(100)];
      if (cursor) queries.push(Query.cursorAfter(cursor));
      const result = await db.listDocuments(dbId, collectionId, queries);
      all.push(...result.documents);
      cursor = result.documents.length > 0 ? result.documents[result.documents.length - 1].\$id : undefined;
    } while (cursor && cursor !== undefined);
    writeFileSync('$SNAPSHOT_DIR/$table.json', JSON.stringify(all, null, 2));
    console.log(all.length + ' documents');
  " 2>/dev/null || echo "skipped (collection not found)"
done

echo ""
echo "Exporting storage bucket: case-documents..."

npx tsx -e "
  import { Client, Storage } from 'node-appwrite';
  import { writeFileSync } from 'fs';

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const storage = new Storage(client);
  const bucketId = 'case-documents';
  const files = [];
  let cursor;
  do {
    const queries = [];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const result = await storage.listFiles(bucketId, queries);
    files.push(...result.files.map(f => ({ id: f.\$id, name: f.name, mimeType: f.mimeType, size: f.size })));
    cursor = result.files.length > 0 ? result.files[result.files.length - 1].\$id : undefined;
  } while (cursor);
  writeFileSync('$SNAPSHOT_DIR/case-documents-index.json', JSON.stringify(files, null, 2));
  console.log(files.length + ' files indexed (download separately)');
" 2>/dev/null || echo "skipped (bucket not found)"

# Write metadata
npx tsx -e "
  import { writeFileSync } from 'fs';
  writeFileSync('$SNAPSHOT_DIR/manifest.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    databaseId: process.env.APPWRITE_DATABASE_ID,
    tablesExported: $(printf '%s\n' "${TABLES[@]}" | npx tsx -e "process.stdout.write(JSON.stringify(require('fs').readFileSync('/dev/stdin','utf8').trim().split('\n')))"),
    version: '1.0',
  }, null, 2));
"

echo ""
echo "=== Backup complete ==="
echo "Snapshot saved to: $SNAPSHOT_DIR"
