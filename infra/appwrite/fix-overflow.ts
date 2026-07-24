/**
 * Fix remaining attribute limits
 *
 * Appwrite free tier limits collections to 25 attributes.
 * Some collections exceeded this. This script adds a single
 * JSON column to store overflow fields as a serialized object.
 *
 * Usage:
 *   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... npx tsx infra/appwrite/fix-overflow.ts
 */
import { Client, Databases } from "node-appwrite";

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

// Collections that need a JSON overflow column for remaining fields
const overflowColumns: Array<{ collection: string; key: string; fields: string[] }> = [
  {
    collection: "audit-findings",
    key: "extendedFields",
    fields: ["recommendation", "managementResponse"],
  },
  {
    collection: "redaction-suggestions",
    key: "extendedFields",
    fields: ["reviewerRationale"],
  },
  {
    collection: "ai-systems",
    key: "extendedFields",
    fields: ["explainabilityDescription", "trainingDataDescription", "approvalRationale"],
  },
];

async function main() {
  console.log("=== Adding overflow JSON columns ===\n");

  for (const col of overflowColumns) {
    console.log(`  ${col.collection}.${col.key} (stores: ${col.fields.join(", ")})`);
    try {
      await db.createStringAttribute(databaseId, col.collection, col.key, 65536, false);
      console.log("    Created");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already exists")) {
        console.log("    Already exists, skipping");
      } else {
        console.warn(`    Failed: ${msg}`);
      }
    }
  }

  console.log("\n=== Done ===");
  console.log("\nNote: These collections now have an 'extendedFields' JSON column.");
  console.log("Store overflow data as: { \"fieldName\": \"value\" }");
}

main().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
