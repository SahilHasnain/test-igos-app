import { ID, InputFile, type Databases, type Storage } from "node-appwrite";
import type { DocumentStore, StoredDocument, UploadDocumentInput } from "@/src/services/document-service";

export class AppwriteDocumentStore implements DocumentStore {
  constructor(
    private readonly storage: Storage,
    private readonly databases: Databases,
    private readonly bucketId: string,
    private readonly databaseId: string,
    private readonly metadataCollectionId: string
  ) {}

  async put(input: UploadDocumentInput & { checksum: string }): Promise<StoredDocument> {
    const fileId = ID.unique();
    let created = false;
    try {
      const file = await this.storage.createFile(this.bucketId, fileId, InputFile.fromBuffer(Buffer.from(input.bytes), input.name));
      created = true;
      const metadata = await this.databases.createDocument(this.databaseId, this.metadataCollectionId, ID.unique(), {
        matId: input.matId,
        academyId: input.academyId ?? null,
        matterId: input.matterId,
        storageFileId: file.$id,
        name: input.name,
        mimeType: input.mimeType,
        size: input.bytes.length,
        checksum: input.checksum,
        retentionClass: input.retentionClass,
        status: "active"
      });
      return { id: metadata.$id, matterId: input.matterId, name: input.name, mimeType: input.mimeType, size: input.bytes.length, checksum: input.checksum, retentionClass: input.retentionClass };
    } catch (error) {
      if (created) await this.storage.deleteFile(this.bucketId, fileId).catch(() => undefined);
      throw error;
    }
  }
}
