/**
 * Appwrite provisioning script
 *
 * Reads schema.json and creates:
 *  - Database "igos-core"
 *  - All 33 tables with correct column types
 *  - Indexes as specified
 *  - "case-documents" bucket with encryption and antivirus
 *
 * Usage:
 *   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... npx tsx infra/appwrite/provision.ts
 */
import { Client, Databases, Storage, ID, Permission, Role, IndexType, Compression } from "node-appwrite";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(resolve(__dirname, "schema.json"), "utf-8"));

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
if (!endpoint || !projectId || !apiKey) {
  console.error("Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const storage = new Storage(client);

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
    array,
    elements,
  };
}

async function createTable(table: { id: string; name: string; permissions: string; columns: string[] }) {
  const dbId = schema.database.id;

  const permissions: string[] = [Permission.read(Role.any())];

  try {
    await databases.createCollection(dbId, table.id, table.name, permissions);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("already exists")) {
      throw e;
    }
  }

  for (const spec of table.columns) {
    const col = parseColumn(spec);
    try {
      if (col.type === "enum" && col.elements) {
        await databases.createEnumAttribute(dbId, table.id, col.key, col.elements, col.required);
      } else if (col.type === "json") {
        await databases.createStringAttribute(dbId, table.id, col.key, 65536, col.required, undefined, col.array);
      } else if (col.type === "datetime") {
        await databases.createDatetimeAttribute(dbId, table.id, col.key, col.required);
      } else if (col.type === "boolean") {
        await databases.createBooleanAttribute(dbId, table.id, col.key, col.required);
      } else if (col.type === "integer") {
        await databases.createIntegerAttribute(dbId, table.id, col.key, col.required);
      } else if (col.type === "double") {
        await databases.createFloatAttribute(dbId, table.id, col.key, col.required);
      } else {
        await databases.createStringAttribute(dbId, table.id, col.key, col.size ?? 256, col.required, undefined, col.array);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("already exists")) {
        console.warn(`    ${table.id}.${col.key}: ${msg}`);
      }
    }
  }
}

async function createIndexes(table: { id: string; columns: string[] }) {
  const dbId = schema.database.id;
  for (const spec of table.columns) {
    const col = parseColumn(spec);
    if (!spec.split(":").slice(2).includes("index")) continue;
    const indexId = `${table.id}_${col.key}_idx`;
    try {
      await databases.createIndex(dbId, table.id, indexId, IndexType.Key, [col.key]);
      console.log(`    Index ${indexId} created.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("already exists")) {
        console.warn(`    Index ${indexId}: ${msg}`);
      }
    }
  }
}

async function createBucket() {
  const bucket = schema.buckets[0];
  console.log(`Creating bucket "${bucket.name}" (${bucket.id})...`);
  try {
    await storage.createBucket(
      bucket.id,
      bucket.name,
      [Permission.create(Role.any()), Permission.read(Role.any())],
      true,
      true,
      bucket.maximumFileSize,
      [],
      Compression.None,
      bucket.encryption,
      bucket.antivirus
    );
    console.log("  Bucket created.");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already exists")) {
      console.log("  Bucket already exists, skipping.");
    } else {
      throw e;
    }
  }
}

async function processCollection(table: { id: string; name: string; permissions: string; columns: string[] }) {
  await createTable(table);
  await createIndexes(table);
}

async function runConcurrent<T>(items: T[], fn: (item: T) => Promise<void>, concurrency: number) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift()!;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

async function main() {
  console.log("=== IGOS Appwrite Provisioning ===\n");

  const dbId = schema.database.id;
  console.log(`Creating database "${schema.database.name}" (${dbId})...`);
  try {
    await databases.create(dbId, schema.database.name);
    console.log("  Database created.");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already exists")) {
      console.log("  Database already exists, skipping.");
    } else {
      throw e;
    }
  }
  console.log("");

  const concurrency = parseInt(process.env.CONCURRENCY ?? "5", 10);
  console.log(`Provisioning ${schema.tables.length} collections with ${concurrency} workers...\n`);

  await runConcurrent(schema.tables, processCollection, concurrency);

  await createBucket();
  console.log("\n=== Provisioning complete ===");
}

main().catch((err) => {
  console.error("Provisioning failed:", err);
  process.exit(1);
});
