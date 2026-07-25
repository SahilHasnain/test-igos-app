/**
 * Verify Appwrite provisioning against schema.json
 *
 * Lists all collections and their attributes/indexes, then compares
 * against the schema definition. Reports missing attributes, extra
 * attributes, missing indexes, and attribute type mismatches.
 *
 * Usage:
 *   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... npx tsx infra/appwrite/verify-provision.ts
 */
import { Client, Databases, IndexType, Query } from "node-appwrite";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(resolve(__dirname, "schema.json"), "utf-8"));

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const dbId = process.env.APPWRITE_DATABASE_ID ?? schema.database.id;

if (!endpoint || !projectId || !apiKey) {
  console.error("Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new Databases(client);

function parseColumn(spec: string) {
  const parts = spec.split(":");
  const key = parts[0];
  const rawType = parts[1];
  const flags = parts.slice(2);

  const array = rawType.endsWith("[]");
  const baseType = array ? rawType.slice(0, -2) : rawType;

  let size: number | undefined;
  const sizeStr = flags.find(f => /^\d+$/.test(f));
  if (sizeStr) size = parseInt(sizeStr, 10);

  let elements: string[] | undefined;
  if (baseType === "enum") {
    const enumDef = flags.find(f => f.startsWith("("));
    if (enumDef) elements = enumDef.slice(1, -1).split(",");
  }

  return {
    key,
    type: baseType,
    size,
    required: flags.includes("required"),
    index: flags.includes("index"),
    array,
    elements,
  };
}

function mapAppwriteType(attr: Record<string, unknown>): string {
  const attrType = attr.type as string;
  const isArray = attr.array as boolean;
  const base = attrType === "string" ? "string"
    : attrType === "integer" ? "integer"
    : attrType === "double" ? "double"
    : attrType === "boolean" ? "boolean"
    : attrType === "datetime" ? "datetime"
    : attrType === "enum" ? "enum"
    : attrType;
  return isArray ? `${base}[]` : base;
}

async function main() {
  console.log("=== Appwrite Provisioning Verification ===\n");
  console.log(`Database: ${dbId}\n`);

  // List all collections
  let allCollections: Record<string, unknown>[] = [];
  try {
    const result = await db.listCollections(dbId, [Query.limit(100)]);
    allCollections = result.collections as Record<string, unknown>[];
  } catch (e) {
    console.error("Failed to list collections:", e);
    process.exit(1);
  }

  const liveMap = new Map<string, Record<string, unknown>>();
  for (const col of allCollections) {
    liveMap.set(col.$id as string, col);
  }

  let totalIssues = 0;
  const issues: string[] = [];

  for (const table of schema.tables) {
    const colId = table.id;
    const live = liveMap.get(colId);

    if (!live) {
      issues.push(`COLLECTION MISSING: ${colId} (${table.name})`);
      totalIssues++;
      continue;
    }

    // Fetch live attributes
    let liveAttrs: Record<string, unknown>[] = [];
    try {
      const res = await db.listAttributes(dbId, colId, []);
      liveAttrs = res.attributes as Record<string, unknown>[];
    } catch (e) {
      issues.push(`  Failed to list attributes for ${colId}: ${e}`);
    }

    const liveAttrMap = new Map<string, Record<string, unknown>>();
    for (const attr of liveAttrs) {
      liveAttrMap.set(attr.key as string, attr);
    }

    // Fetch live indexes
    let liveIndexes: Record<string, unknown>[] = [];
    try {
      const res = await db.listIndexes(dbId, colId, []);
      liveIndexes = res.indexes as Record<string, unknown>[];
    } catch (e) {
      issues.push(`  Failed to list indexes for ${colId}: ${e}`);
    }

    const liveIndexMap = new Map<string, Record<string, unknown>>();
    for (const idx of liveIndexes) {
      liveIndexMap.set(idx.key as string, idx);
    }

    const expectedCols = table.columns.map(parseColumn);

    console.log(`--- ${colId} (${table.name}) ---`);
    console.log(`  Expected: ${expectedCols.length} attributes, Live: ${liveAttrs.length} attributes, ${liveIndexes.length} indexes`);

    // Check each expected column exists
    for (const expected of expectedCols) {
      const liveAttr = liveAttrMap.get(expected.key);

      if (!liveAttr) {
        const msg = `  MISSING ATTR: ${colId}.${expected.key} (${expected.type}${expected.required ? ":required" : ""})`;
        console.log(msg);
        issues.push(msg);
        totalIssues++;
        continue;
      }

      // Check type
      const liveType = mapAppwriteType(liveAttr);
      const expectedType = expected.array ? `${expected.type}[]` : expected.type;
      if (liveType !== expectedType) {
        const msg = `  TYPE MISMATCH: ${colId}.${expected.key} expected=${expectedType} live=${liveType}`;
        console.log(msg);
        issues.push(msg);
        totalIssues++;
      }

      // Check required
      const liveRequired = liveAttr.required as boolean;
      if (expected.required !== liveRequired) {
        const msg = `  REQUIRED MISMATCH: ${colId}.${expected.key} expected=${expected.required} live=${liveRequired}`;
        console.log(msg);
        issues.push(msg);
        totalIssues++;
      }

      // Check enum elements
      if (expected.type === "enum" && expected.elements) {
        const liveElements = liveAttr.elements as string[];
        const missing = expected.elements.filter((e: string) => !liveElements.includes(e));
        if (missing.length) {
          const msg = `  ENUM MISSING: ${colId}.${expected.key} missing elements: ${missing.join(", ")}`;
          console.log(msg);
          issues.push(msg);
          totalIssues++;
        }
      }

      // Check index
      const expectedIndexId = `${colId}_${expected.key}_idx`;
      // Also check short-name variants
      const hasIndex = liveAttr.index as boolean || liveIndexMap.has(expectedIndexId) || Array.from(liveIndexMap.values()).some(idx => {
        const attrs = idx.attributes as string[];
        return attrs && attrs.includes(expected.key);
      });

      if (expected.index && !hasIndex) {
        const msg = `  MISSING INDEX: ${colId}.${expected.key} (expected index on this attribute)`;
        console.log(msg);
        issues.push(msg);
        totalIssues++;
      }
    }

    // Check for extra attributes not in schema
    for (const [key] of liveAttrMap) {
      if (key.startsWith("$")) continue; // Skip Appwrite internal fields
      if (!expectedCols.find((c: { key: string }) => c.key === key)) {
        console.log(`  EXTRA ATTR: ${colId}.${key} (not in schema)`);
      }
    }

    if (totalIssues === 0 || issues.length === 0) {
      console.log("  OK");
    }
    console.log("");
  }

  // Check bucket
  console.log("--- Buckets ---");
  const expectedBucket = schema.buckets[0];
  try {
    const storage = new (await import("node-appwrite")).Storage(client);
    const bucket = await storage.getBucket(expectedBucket.id);
    console.log(`  Bucket "${expectedBucket.id}": OK (encryption=${bucket.encryption}, antivirus=${bucket.antivirus})`);
  } catch (e) {
    const msg = `  BUCKET MISSING: ${expectedBucket.id} (${expectedBucket.name})`;
    console.log(msg);
    issues.push(msg);
    totalIssues++;
  }

  console.log("\n=== Summary ===");
  console.log(`Total issues: ${totalIssues}`);
  if (issues.length) {
    console.log("\nIssues:");
    issues.forEach(i => console.log(i));
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
