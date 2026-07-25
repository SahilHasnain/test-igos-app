import { ID, Query, type Databases } from "node-appwrite";
import type { RecordInstance } from "@/src/domain/advanced-governance";
import type { TenantScope } from "@/src/domain/model";

export interface RecordInstanceRepository {
  list(scope: TenantScope): Promise<readonly RecordInstance[]>;
  listByAsset(scope: TenantScope, assetId: string): Promise<readonly RecordInstance[]>;
  findById(scope: TenantScope, id: string): Promise<RecordInstance | null>;
  save(scope: TenantScope, record: RecordInstance): Promise<RecordInstance>;
}

function toRecordInstance(document: Record<string, unknown>): RecordInstance {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    assetId: document.assetId as string,
    retentionRuleId: document.retentionRuleId as string,
    triggerAt: document.triggerAt as string,
    dispositionDueAt: document.dispositionDueAt as string,
    status: document.status as RecordInstance["status"],
    disposalEvidenceDocumentId: (document.disposalEvidenceDocumentId as string) || undefined,
  };
}

export class AppwriteRecordInstanceRepository implements RecordInstanceRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly RecordInstance[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ];
    if (scope.academyId) {
      queries.push(Query.equal("academyId", scope.academyId));
    }
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );
    return result.documents.map((doc) => toRecordInstance(doc as Record<string, unknown>));
  }

  async listByAsset(scope: TenantScope, assetId: string): Promise<readonly RecordInstance[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("assetId", assetId),
      Query.limit(100),
    ];
    if (scope.academyId) {
      queries.push(Query.equal("academyId", scope.academyId));
    }
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );
    return result.documents.map((doc) => toRecordInstance(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<RecordInstance | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const record = toRecordInstance(doc as Record<string, unknown>);
      if (record.matId !== scope.matId) return null;
      if (scope.academyId && record.academyId !== scope.academyId) return null;
      return record;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, record: RecordInstance): Promise<RecordInstance> {
    if (record.matId !== scope.matId) throw new Error("Record instance is outside the authorised scope");
    if (scope.academyId && record.academyId !== scope.academyId) {
      throw new Error("Record instance is outside the authorised scope");
    }

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("assetId", record.assetId),
        Query.limit(100),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === record.id);

    const data = {
      matId: scope.matId,
      academyId: scope.academyId ?? null,
      assetId: record.assetId || "pending",
      retentionRuleId: record.retentionRuleId || "pending",
      triggerAt: record.triggerAt || new Date().toISOString(),
      dispositionDueAt: record.dispositionDueAt || new Date(Date.now() + 365 * 86400000).toISOString(),
      status: record.status || "active",
      disposalEvidenceDocumentId: record.disposalEvidenceDocumentId ?? null,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toRecordInstance(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      record.id || ID.unique(),
      data
    );
    return toRecordInstance(doc as Record<string, unknown>);
  }
}
