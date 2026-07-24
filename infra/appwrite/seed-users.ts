/**
 * Seed Appwrite test users — one per role for E2E testing.
 * Creates Appwrite accounts + membership records.
 *
 * Usage:
 *   npx tsx infra/appwrite/seed-users.ts
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Client, Databases, Users, ID, Query } from "node-appwrite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvLocal() {
  try {
    const content = readFileSync(resolve(__dirname, "../../.env.local"), "utf8");
    const vars: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    for (const [key, val] of Object.entries(vars)) {
      if (!process.env[key]) process.env[key] = val;
    }
    // Map NEXT_PUBLIC_ prefixed vars to unprefixed for scripts
    if (vars.NEXT_PUBLIC_APPWRITE_ENDPOINT && !process.env.APPWRITE_ENDPOINT) {
      process.env.APPWRITE_ENDPOINT = vars.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    }
    if (vars.NEXT_PUBLIC_APPWRITE_PROJECT_ID && !process.env.APPWRITE_PROJECT_ID) {
      process.env.APPWRITE_PROJECT_ID = vars.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    }
  } catch { /* .env.local not found, rely on shell env */ }
}

loadEnvLocal();

const endpoint = process.env.APPWRITE_ENDPOINT ?? "";
const projectId = process.env.APPWRITE_PROJECT_ID ?? "";
const apiKey = process.env.APPWRITE_API_KEY ?? "";
const databaseId = process.env.APPWRITE_DATABASE_ID ?? "";
const matId = process.env.APPWRITE_SEEDED_MAT_ID ?? "";
const academyIdsRaw = process.env.APPWRITE_SEEDED_ACADEMY_IDS ?? "";

if (!endpoint || !projectId || !apiKey || !databaseId || !matId || !academyIdsRaw) {
  console.error("Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID, APPWRITE_SEEDED_MAT_ID, APPWRITE_SEEDED_ACADEMY_IDS");
  process.exit(1);
}

const academyIds = academyIdsRaw.split(",").map((s) => s.trim());

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const users = new Users(client);

const PASSWORD = "Change-Me-2026!";

interface TestUser {
  email: string;
  name: string;
  roles: string[];
  academyIds: string[];
}

const TEST_USERS: TestUser[] = [
  {
    email: "dpo@rosa-federation.igos.local",
    name: "IGOS DPO",
    roles: ["dpo"],
    academyIds,
  },
  {
    email: "mat-admin@rosa-federation.igos.local",
    name: "IGOS MAT Admin",
    roles: ["mat-admin"],
    academyIds,
  },
  {
    email: "case-manager@rosa-federation.igos.local",
    name: "IGOS Case Manager",
    roles: ["case-manager"],
    academyIds: academyIds.slice(0, 2),
  },
  {
    email: "academy-lead@rosa-federation.igos.local",
    name: "IGOS Academy Lead",
    roles: ["academy-lead"],
    academyIds: academyIds.slice(0, 1),
  },
  {
    email: "auditor@rosa-federation.igos.local",
    name: "IGOS Auditor",
    roles: ["auditor"],
    academyIds,
  },
  {
    email: "readonly@rosa-federation.igos.local",
    name: "IGOS Read Only",
    roles: ["read-only"],
    academyIds,
  },
];

async function ensureUser(user: TestUser): Promise<string> {
  const existing = await users.list([Query.equal("email", user.email)]);
  if (existing.users.length > 0) {
    const id = existing.users[0].$id;
    console.log(`  ${user.email} already exists (${id}), skipping.`);
    return id;
  }

  const created = await users.create(ID.unique(), user.email, undefined, PASSWORD, user.name);
  console.log(`  ${user.email} created (${created.$id}).`);
  return created.$id;
}

async function ensureMembership(userId: string, user: TestUser) {
  const existing = await databases.listDocuments(databaseId, "memberships", [
    Query.equal("matId", matId),
    Query.equal("userId", userId),
  ]);
  if (existing.documents.length > 0) {
    console.log(`  Membership for ${user.email} already exists, skipping.`);
    return;
  }

  await databases.createDocument(databaseId, "memberships", ID.unique(), {
    matId,
    userId,
    academyIds: user.academyIds,
    roles: user.roles,
    status: "active",
  });
  console.log(`  Membership for ${user.email} created (role: ${user.roles.join(", ")}).`);
}

async function main() {
  console.log("=== Seeding E2E test users ===\n");

  for (const user of TEST_USERS) {
    console.log(`Processing ${user.email}...`);
    const userId = await ensureUser(user);
    await ensureMembership(userId, user);
  }

  console.log("\n=== Done ===");
  console.log("\nTest credentials (all use password: Change-Me-2026!):");
  for (const user of TEST_USERS) {
    console.log(`  ${user.email} → ${user.roles.join(", ")}`);
  }
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
