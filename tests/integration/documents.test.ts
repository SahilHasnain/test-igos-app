import { describe, expect, it, beforeAll } from "vitest";
import { Client, Storage, ID, Permission, Role } from "node-appwrite";

const hasAppwrite = !!(process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY);

const describeAppwrite = hasAppwrite ? describe : describe.skip;

describeAppwrite("Document upload & AV scan", () => {
  let storage: Storage;
  const bucketId = "case-documents";
  const uploadedIds: string[] = [];

  beforeAll(() => {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);
    storage = new Storage(client);
  });

  it("uploads a document and creates metadata", async () => {
    const content = new TextEncoder().encode("Test document content for AV scan");
    const file = new File([content], "test-upload.txt", { type: "text/plain" });

    const result = await storage.createFile(
      bucketId,
      ID.unique(),
      file,
      [Permission.read(Role.any()), Permission.write(Role.any())],
    );

    uploadedIds.push(result.$id);
    expect(result.$id).toBeTruthy();
    expect(result.name).toBe("test-upload.txt");
    expect(result.sizeOriginal).toBe(content.byteLength);
  });

  it("retrieves uploaded document metadata", async () => {
    const fileId = uploadedIds[0];
    const file = await storage.getFile(bucketId, fileId);
    expect(file.$id).toBe(fileId);
  });

  it("generates a signed download URL", async () => {
    const fileId = uploadedIds[0];
    const url = await storage.getFileDownload(bucketId, fileId);
    expect(url).toContain("v1/storage");
    expect(url).toContain(fileId);
  });

  it("deletes uploaded test documents", async () => {
    for (const id of uploadedIds) {
      await storage.deleteFile(bucketId, id);
    }
    const remaining = await storage.listFiles(bucketId);
    const found = remaining.files.filter((f) => uploadedIds.includes(f.$id));
    expect(found.length).toBe(0);
  });
});
