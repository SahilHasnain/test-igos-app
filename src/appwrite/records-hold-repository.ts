import { ID, Query, type Databases } from "node-appwrite";
import type { RecordsHold } from "@/src/domain/advanced-governance";
import type { TenantScope } from "@/src/domain/model";

export interface RecordsHoldRepository {
  list(scope: TenantScope): Promise<readonly RecordsHold[]>;
  listActive(scope: TenantScope): Promise<readonly RecordsHold[]>;
  findById(scope: TenantScope, id: string): Promise<RecordsHold | null>;
  save(scope: TenantScope, hold: RecordsHold): Promise<RecordsHold>;
}

function toRecordsHold(document: Record<string, unknown>): RecordsHold {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    name: document.name as string,
    reason: document.reason as RecordsHold["reason"],
    matterId: (document.matterId as string) || undefined,
    recordIds: (document.recordIds as string[]) || [],
    assetIds: (document.assetIds as string[]) || [],
    imposedByUserId: document.imposedByUserId as string,
    imposedAt: document.imposedAt as string,
    releasedByUserId: (document.releasedByUserId as string) || undefined,
    releasedAt: (document.releasedAt as string) || undefined,
    releaseRationale: (document.releaseRationale as string) || undefined,
  };
}

export class AppwriteRecordsHoldRepository implements RecordsHoldRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly RecordsHold[]> {
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
    return result.documents.map((doc) => toRecordsHold(doc as Record<string, unknown>));
  }

  async listActive(scope: TenantScope): Promise<readonly RecordsHold[]> {
    const holds = await this.list(scope);
    return holds.filter((hold) => !hold.releasedAt);
  }

  async findById(scope: TenantScope, id: string): Promise<RecordsHold | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const hold = toRecordsHold(doc as Record<string, unknown>);
      if (hold.matId !== scope.matId) return null;
      if (scope.academyId && hold.academyId !== scope.academyId) return null;
      return hold;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, hold: RecordsHold): Promise<RecordsHold> {
    if (hold.matId !== scope.matId) throw new Error("Records hold is outside the authorised scope");
    if (scope.academyId && hold.academyId !== scope.academyId) {
      throw new Error("Records hold is outside the authorised scope");
    }

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("name", hold.name),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === hold.id);

    const data = {
      matId: scope.matId,
      academyId: scope.academyId ?? null,
      name: hold.name || "Untitled hold",
      reason: hold.reason || "audit",
      matterId: hold.matterId ?? null,
      recordIds: Array.isArray(hold.recordIds) ? hold.recordIds : [],
      assetIds: Array.isArray(hold.assetIds) ? hold.assetIds : [],
      imposedByUserId: hold.imposedByUserId || "system",
      imposedAt: hold.imposedAt || new Date().toISOString(),
      releasedByUserId: hold.releasedByUserId ?? null,
      releasedAt: hold.releasedAt ?? null,
      releaseRationale: hold.releaseRationale ?? null,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toRecordsHold(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      hold.id || ID.unique(),
      data
    );
    return toRecordsHold(doc as Record<string, unknown>);
  }
}
