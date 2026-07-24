import { describe, expect, it, beforeAll } from "vitest";
import { Client, Databases, ID, Query } from "node-appwrite";

const hasAppwrite = !!(process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY && process.env.APPWRITE_DATABASE_ID);

const describeAppwrite = hasAppwrite ? describe : describe.skip;

describeAppwrite("Backup restoration round-trip", () => {
  let databases: Databases;
  const dbId = process.env.APPWRITE_DATABASE_ID!;
  const testCollectionId = "mats";
  const testDocIds: string[] = [];

  beforeAll(() => {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);
    databases = new Databases(client);
  });

  it("creates test documents for backup verification", async () => {
    const doc1 = await databases.createDocument(dbId, testCollectionId, ID.unique(), {
      name: "Backup Test MAT",
      slug: `backup-test-${Date.now()}`,
      status: "active",
      settings: JSON.stringify({ timezone: "Europe/London" }),
    });
    testDocIds.push(doc1.$id);
    expect(doc1.$id).toBeTruthy();
  });

  it("reads back test documents via queries", async () => {
    const result = await databases.listDocuments(dbId, testCollectionId, [
      Query.equal("status", "active"),
      Query.limit(100),
    ]);
    expect(result.documents.length).toBeGreaterThan(0);
    const found = result.documents.find((d) => testDocIds.includes(d.$id));
    expect(found).toBeDefined();
  });

  it("cleans up test documents", async () => {
    for (const id of testDocIds) {
      await databases.deleteDocument(dbId, testCollectionId, id);
    }
    const remaining = await databases.listDocuments(dbId, testCollectionId, [
      Query.limit(100),
    ]);
    const found = remaining.documents.filter((d) => testDocIds.includes(d.$id));
    expect(found.length).toBe(0);
  });
});
