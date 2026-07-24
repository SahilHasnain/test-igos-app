#!/usr/bin/env bash
set -euo pipefail

# IGOS Appwrite restoration script
# Imports data from a snapshot directory into Appwrite.
#
# Usage:
#   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... APPWRITE_DATABASE_ID=... ./infra/backup/restore.sh <snapshot_dir>
#
# WARNING: This will overwrite existing data in the target collections.

SNAPSHOT_DIR="${1:?Usage: restore.sh <snapshot_dir>}"

if [ -z "${APPWRITE_ENDPOINT:-}" ] || [ -z "${APPWRITE_PROJECT_ID:-}" ] || [ -z "${APPWRITE_API_KEY:-}" ] || [ -z "${APPWRITE_DATABASE_ID:-}" ]; then
  echo "Error: Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID"
  exit 1
fi

if [ ! -d "$SNAPSHOT_DIR" ]; then
  echo "Error: Snapshot directory '$SNAPSHOT_DIR' does not exist"
  exit 1
fi

if [ ! -f "$SNAPSHOT_DIR/manifest.json" ]; then
  echo "Error: No manifest.json found in '$SNAPSHOT_DIR'"
  exit 1
fi

echo "=== IGOS Restore ==="
echo "Snapshot: $SNAPSHOT_DIR"
echo ""

# Show manifest
npx tsx -e "
  const manifest = JSON.parse(require('fs').readFileSync('$SNAPSHOT_DIR/manifest.json', 'utf8'));
  console.log('Backup timestamp: ' + manifest.timestamp);
  console.log('Database: ' + manifest.databaseId);
  console.log('Tables: ' + manifest.tablesExported.length);
"

echo ""
echo "WARNING: This will import data into $APPWRITE_DATABASE_ID"
read -p "Continue? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Importing collections..."

for file in "$SNAPSHOT_DIR"/*.json; do
  filename=$(basename "$file" .json)
  if [ "$filename" = "manifest" ] || [ "$filename" = "case-documents-index" ]; then
    continue
  fi

  count=$(npx tsx -e "
    import { readFileSync } from 'fs';
    const data = JSON.parse(readFileSync('$file', 'utf8'));
    process.stdout.write(String(data.length));
  " 2>/dev/null)

  if [ -z "$count" ] || [ "$count" = "0" ]; then
    echo "  $filename: empty, skipping"
    continue
  fi

  echo -n "  $filename ($count documents)... "

  npx tsx -e "
    import { Client, Databases, ID } from 'node-appwrite';
    import { readFileSync } from 'fs';

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);
    const db = new Databases(client);
    const dbId = process.env.APPWRITE_DATABASE_ID;
    const collectionId = '$filename';
    const documents = JSON.parse(readFileSync('$file', 'utf8'));

    let imported = 0;
    for (const doc of documents) {
      const { \$id, \$createdAt, \$updatedAt, \$permissions, ...data } = doc;
      try {
        await db.createDocument(dbId, collectionId, \$id || ID.unique(), data);
        imported++;
      } catch (e) {
        if (e.message?.includes('already exists')) {
          await db.updateDocument(dbId, collectionId, \$id, data);
          imported++;
        } else {
          console.error('Failed: ' + e.message);
        }
      }
    }
    console.log(imported + ' imported');
  " 2>/dev/null || echo "failed"
done

echo ""
echo "=== Restore complete ==="
