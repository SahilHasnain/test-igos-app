/**
 * Appwrite data bootstrap script
 *
 * Creates initial MAT, academies, and admin user.
 * Requires provisioning to have been run first.
 *
 * Usage:
 *   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... APPWRITE_DATABASE_ID=... npx tsx infra/appwrite/seed.ts
 */
import { Client, Databases, Users, ID, Query } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT ?? "";
const projectId = process.env.APPWRITE_PROJECT_ID ?? "";
const apiKey = process.env.APPWRITE_API_KEY ?? "";
const databaseId = process.env.APPWRITE_DATABASE_ID ?? "";

if (!endpoint || !projectId || !apiKey || !databaseId) {
  console.error("Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const users = new Users(client);

const MATS_TABLE = "mats";
const ACADEMIES_TABLE = "academies";
const MEMBERSHIPS_TABLE = "memberships";

const MAT_SLUG = "rosa-federation";
const MAT_NAME = "Rosa Federation";
const ADMIN_EMAIL = "admin@rosa-federation.igos.local";
const ADMIN_PASSWORD = "Change-Me-2026!";

const academies = [
  { name: "Riverside Academy", urn: "100001" },
  { name: "Hillcrest Academy", urn: "100002" },
  { name: "Greenfield Academy", urn: "100003" },
  { name: "Lakeside Academy", urn: "100004" },
  { name: "Meadow Academy", urn: "100005" },
];

function docId(doc: { $id?: string }): string {
  return doc.$id ?? "";
}

async function ensureAdminUser(): Promise<string> {
  console.log(`Ensuring admin user ${ADMIN_EMAIL}...`);

  const existing = await users.list([Query.equal("email", ADMIN_EMAIL)]);
  if (existing.users.length > 0) {
    const id = existing.users[0].$id;
    console.log(`  User already exists (${id}), skipping.`);
    return id;
  }

  const user = await users.create(ID.unique(), ADMIN_EMAIL, undefined, ADMIN_PASSWORD, "IGOS Administrator");
  console.log(`  User created (${user.$id}).`);
  return user.$id;
}

async function createMat(): Promise<string> {
  console.log(`Creating MAT "${MAT_NAME}"...`);

  const existing = await databases.listDocuments(databaseId, MATS_TABLE, [Query.equal("slug", MAT_SLUG)]);
  if (existing.documents.length > 0) {
    const id = docId(existing.documents[0]);
    console.log(`  MAT already exists (${id}), skipping.`);
    return id;
  }

  const doc = await databases.createDocument(databaseId, MATS_TABLE, ID.unique(), {
    name: MAT_NAME,
    slug: MAT_SLUG,
    status: "active",
    settings: JSON.stringify({ timezone: "Europe/London" }),
  });
  console.log(`  MAT created (${doc.$id}).`);
  return doc.$id;
}

async function createAcademies(matId: string): Promise<string[]> {
  console.log("Creating academies...");
  const ids: string[] = [];

  for (const academy of academies) {
    const existing = await databases.listDocuments(databaseId, ACADEMIES_TABLE, [
      Query.equal("matId", matId),
      Query.equal("name", academy.name),
    ]);
    if (existing.documents.length > 0) {
      const id = docId(existing.documents[0]);
      console.log(`  ${academy.name} already exists (${id}), skipping.`);
      ids.push(id);
      continue;
    }

    const doc = await databases.createDocument(databaseId, ACADEMIES_TABLE, ID.unique(), {
      matId,
      name: academy.name,
      urn: academy.urn,
      status: "active",
    });
    console.log(`  ${academy.name} created (${doc.$id}).`);
    ids.push(doc.$id);
  }

  return ids;
}

async function createMembership(matId: string, userId: string, academyIds: string[]) {
  console.log("Creating admin membership...");

  const existing = await databases.listDocuments(databaseId, MEMBERSHIPS_TABLE, [
    Query.equal("matId", matId),
    Query.equal("userId", userId),
  ]);
  if (existing.documents.length > 0) {
    console.log("  Membership already exists, skipping.");
    return;
  }

  await databases.createDocument(databaseId, MEMBERSHIPS_TABLE, ID.unique(), {
    matId,
    userId,
    academyIds,
    roles: ["mat-admin", "dpo"],
    status: "active",
  });
  console.log("  Admin membership created.");
}

async function main() {
  console.log("=== IGOS Data Bootstrap ===\n");

  const userId = await ensureAdminUser();
  const matId = await createMat();
  const academyIds = await createAcademies(matId);
  await createMembership(matId, userId, academyIds);

  console.log("\n=== Bootstrap complete ===");
  console.log(`\nIDs for .env.local:`);
  console.log(`  MAT_ID=${matId}`);
  console.log(`  ADMIN_USER_ID=${userId}`);
  console.log(`  ACADEMY_IDS=${academyIds.join(",")}`);
}

main().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
