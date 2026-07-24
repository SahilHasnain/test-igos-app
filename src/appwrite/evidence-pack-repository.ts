import { ID, Query, type Databases } from "node-appwrite";
import type { EvidencePack } from "@/src/services/assurance-reporting";
import type { TenantScope } from "@/src/domain/model";

export interface EvidencePackRepository {
  list(scope: TenantScope): Promise<readonly EvidencePack[]>;
  findById(scope: TenantScope, id: string): Promise<EvidencePack | null>;
  save(scope: TenantScope, pack: EvidencePack): Promise<EvidencePack>;
}

function toEvidencePack(document: Record<string, unknown>): EvidencePack {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    title: document.title as string,
    generatedAt: document.generatedAt as string,
    generatedByUserId: document.generatedByUserId as string,
    items: (typeof document.items === "string" ? JSON.parse(document.items) : document.items) || [],
    manifestHash: document.manifestHash as string,
  };
}

export class AppwriteEvidencePackRepository implements EvidencePackRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly EvidencePack[]> {
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
    return result.documents.map((doc) => toEvidencePack(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<EvidencePack | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const pack = toEvidencePack(doc as Record<string, unknown>);
      if (pack.matId !== scope.matId) return null;
      if (scope.academyId && pack.academyId !== scope.academyId) return null;
      return pack;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, pack: EvidencePack): Promise<EvidencePack> {
    if (pack.matId !== scope.matId) throw new Error("Evidence pack is outside the authorised scope");
    if (scope.academyId && pack.academyId !== scope.academyId) {
      throw new Error("Evidence pack is outside the authorised scope");
    }

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("title", pack.title),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === pack.id);

    const data = {
      matId: scope.matId,
      academyId: pack.academyId ?? null,
      title: pack.title,
      generatedAt: pack.generatedAt,
      generatedByUserId: pack.generatedByUserId,
      items: JSON.stringify(pack.items),
      manifestHash: pack.manifestHash,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toEvidencePack(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      pack.id || ID.unique(),
      data
    );
    return toEvidencePack(doc as Record<string, unknown>);
  }
}
