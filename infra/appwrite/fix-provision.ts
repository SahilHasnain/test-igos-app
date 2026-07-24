/**
 * Fix provisioning issues
 *
 * Addresses two problems from the initial provisioning:
 * 1. Index key names exceeding 36-character Appwrite limit
 * 2. Collections hitting the attribute limit (missing columns)
 *
 * Usage:
 *   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... npx tsx infra/appwrite/fix-provision.ts
 */
import { Client, Databases, IndexType } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID ?? "igos-core";

if (!endpoint || !projectId || !apiKey) {
  console.error("Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new Databases(client);

// Indexes that exceeded 36-char limit: collection_id → [{oldKey, newKey, attribute}]
const brokenIndexes: Array<{ collection: string; oldKey: string; newKey: string; attribute: string }> = [
  { collection: "notification-receipts", oldKey: "notification-receipts_idempotencyKey_idx", newKey: "nr_idempotency_idx", attribute: "idempotencyKey" },
  { collection: "processing-activities", oldKey: "processing-activities_ownerUserId_idx", newKey: "pa_owner_idx", attribute: "ownerUserId" },
  { collection: "processing-activities", oldKey: "processing-activities_lawfulBasis_idx", newKey: "pa_lawfulBasis_idx", attribute: "lawfulBasis" },
  { collection: "processing-activities", oldKey: "processing-activities_nextReviewAt_idx", newKey: "pa_nextReview_idx", attribute: "nextReviewAt" },
  { collection: "supplier-assessments", oldKey: "supplier-assessments_supplierName_idx", newKey: "sa_supplierName_idx", attribute: "supplierName" },
  { collection: "supplier-assessments", oldKey: "supplier-assessments_relationship_idx", newKey: "sa_relationship_idx", attribute: "relationship" },
  { collection: "supplier-assessments", oldKey: "supplier-assessments_securityQuestionnaireStatus_idx", newKey: "sa_secQStatus_idx", attribute: "securityQuestionnaireStatus" },
  { collection: "supplier-assessments", oldKey: "supplier-assessments_contractStatus_idx", newKey: "sa_contractStatus_idx", attribute: "contractStatus" },
  { collection: "transfer-assessments", oldKey: "transfer-assessments_transferMechanism_idx", newKey: "ta_transferMech_idx", attribute: "transferMechanism" },
  { collection: "transfer-assessments", oldKey: "transfer-assessments_residualRisk_idx", newKey: "ta_residualRisk_idx", attribute: "residualRisk" },
  { collection: "audit-programmes", oldKey: "audit-programmes_leadAuditorUserId_idx", newKey: "ap_leadAuditor_idx", attribute: "leadAuditorUserId" },
  { collection: "redaction-analysis-runs", oldKey: "redaction-analysis-runs_academyId_idx", newKey: "rar_academy_idx", attribute: "academyId" },
  { collection: "redaction-analysis-runs", oldKey: "redaction-analysis-runs_documentId_idx", newKey: "rar_document_idx", attribute: "documentId" },
  { collection: "redaction-analysis-runs", oldKey: "redaction-analysis-runs_startedAt_idx", newKey: "rar_startedAt_idx", attribute: "startedAt" },
  { collection: "redaction-second-reviews", oldKey: "redaction-second-reviews_academyId_idx", newKey: "rsr_academy_idx", attribute: "academyId" },
  { collection: "redaction-second-reviews", oldKey: "redaction-second-reviews_matterId_idx", newKey: "rsr_matter_idx", attribute: "matterId" },
  { collection: "redaction-second-reviews", oldKey: "redaction-second-reviews_suggestionId_idx", newKey: "rsr_suggestion_idx", attribute: "suggestionId" },
  { collection: "redaction-second-reviews", oldKey: "redaction-second-reviews_reviewedAt_idx", newKey: "rsr_reviewedAt_idx", attribute: "reviewedAt" },
  { collection: "information-assets", oldKey: "information-assets_classification_idx", newKey: "ia_classification_idx", attribute: "classification" },
  { collection: "record-instances", oldKey: "record-instances_dispositionDueAt_idx", newKey: "ri_dispDueAt_idx", attribute: "dispositionDueAt" },
  { collection: "contract-governance", oldKey: "contract-governance_renewalNoticeAt_idx", newKey: "cg_renewalNotice_idx", attribute: "renewalNoticeAt" },
];

// Columns that failed due to attribute limit per collection
const missingColumns: Array<{ collection: string; key: string; type: string; size?: number }> = [
  { collection: "dpia-risks", key: "acceptanceRationale", type: "string", size: 4096 },
  { collection: "supplier-assessments", key: "residualRiskRationale", type: "string", size: 4096 },
  { collection: "assurance-actions", key: "closureRationale", type: "string", size: 4096 },
  { collection: "audit-findings", key: "rootCause", type: "string", size: 4096 },
  { collection: "audit-findings", key: "recommendation", type: "string", size: 4096 },
  { collection: "audit-findings", key: "managementResponse", type: "string", size: 4096 },
  { collection: "assurance-risks", key: "acceptanceRationale", type: "string", size: 4096 },
  { collection: "redaction-suggestions", key: "reviewerRationale", type: "string", size: 4096 },
  { collection: "ai-systems", key: "humanOversightDescription", type: "string", size: 4096 },
  { collection: "ai-systems", key: "explainabilityDescription", type: "string", size: 4096 },
  { collection: "ai-systems", key: "trainingDataDescription", type: "string", size: 4096 },
  { collection: "ai-systems", key: "approvalRationale", type: "string", size: 4096 },
];

async function fixIndexes() {
  console.log("=== Fixing broken indexes ===\n");

  for (const idx of brokenIndexes) {
    console.log(`  ${idx.collection}.${idx.attribute}:`);

    // Try to delete the old index (may already be gone)
    try {
      await db.deleteIndex(databaseId, idx.collection, idx.oldKey);
      console.log(`    Deleted old index ${idx.oldKey}`);
    } catch {
      // Index may not exist (was never created due to the error)
    }

    // Create new index with short name
    try {
      await db.createIndex(databaseId, idx.collection, idx.newKey, IndexType.Key, [idx.attribute]);
      console.log(`    Created index ${idx.newKey}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists")) {
        console.log(`    Index ${idx.newKey} already exists, skipping`);
      } else {
        console.warn(`    Failed to create ${idx.newKey}: ${msg}`);
      }
    }
  }
}

async function fixColumns() {
  console.log("\n=== Fixing missing columns ===\n");

  for (const col of missingColumns) {
    console.log(`  ${col.collection}.${col.key}:`);
    try {
      await db.createStringAttribute(databaseId, col.collection, col.key, col.size ?? 256, false);
      console.log(`    Column created`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists")) {
        console.log(`    Column already exists, skipping`);
      } else {
        console.warn(`    Failed: ${msg}`);
      }
    }
  }
}

async function main() {
  console.log("=== IGOS Provisioning Fix ===\n");
  await fixIndexes();
  await fixColumns();
  console.log("\n=== Fix complete ===");
}

main().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
