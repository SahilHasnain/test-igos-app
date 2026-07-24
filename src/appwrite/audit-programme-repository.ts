import { ID, Query, type Databases } from "node-appwrite";
import type { AuditProgramme } from "@/src/domain/assurance";
import type { TenantScope } from "@/src/domain/model";

export interface AuditProgrammeRepository {
  list(scope: TenantScope): Promise<readonly AuditProgramme[]>;
  findById(scope: TenantScope, id: string): Promise<AuditProgramme | null>;
  save(scope: TenantScope, programme: AuditProgramme): Promise<AuditProgramme>;
}

function toAuditProgramme(document: Record<string, unknown>): AuditProgramme {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    title: document.title as string,
    scope: document.scope as string,
    academyIds: (document.academyIds as string[]) || [],
    leadAuditorUserId: document.leadAuditorUserId as string,
    plannedStartAt: document.plannedStartAt as string,
    plannedEndAt: document.plannedEndAt as string,
    status: document.status as AuditProgramme["status"],
  };
}

export class AppwriteAuditProgrammeRepository implements AuditProgrammeRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly AuditProgramme[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ];
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );
    return result.documents.map((doc) => toAuditProgramme(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<AuditProgramme | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const programme = toAuditProgramme(doc as Record<string, unknown>);
      if (programme.matId !== scope.matId) return null;
      return programme;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, programme: AuditProgramme): Promise<AuditProgramme> {
    if (programme.matId !== scope.matId) throw new Error("Audit programme is outside the authorised scope");

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("title", programme.title),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === programme.id);

    const data = {
      matId: scope.matId,
      title: programme.title,
      scope: programme.scope,
      academyIds: JSON.stringify(programme.academyIds),
      leadAuditorUserId: programme.leadAuditorUserId,
      plannedStartAt: programme.plannedStartAt,
      plannedEndAt: programme.plannedEndAt,
      status: programme.status,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toAuditProgramme(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      programme.id || ID.unique(),
      data
    );
    return toAuditProgramme(doc as Record<string, unknown>);
  }
}
