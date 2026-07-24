import { ID, Query, type Databases } from "node-appwrite";
import type { AuditFinding } from "@/src/domain/assurance";
import type { TenantScope } from "@/src/domain/model";

export interface AuditFindingRepository {
  list(scope: TenantScope): Promise<readonly AuditFinding[]>;
  findById(scope: TenantScope, id: string): Promise<AuditFinding | null>;
  save(scope: TenantScope, finding: AuditFinding): Promise<AuditFinding>;
}

function toAuditFinding(document: Record<string, unknown>): AuditFinding {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    auditProgrammeId: document.auditProgrammeId as string,
    title: document.title as string,
    description: document.description as string,
    rating: document.rating as AuditFinding["rating"],
    rootCause: document.rootCause as string,
    recommendation: document.recommendation as string,
    managementResponse: (document.managementResponse as string) || undefined,
    ownerUserId: document.ownerUserId as string,
    dueAt: document.dueAt as string,
    status: document.status as AuditFinding["status"],
    verifiedByUserId: (document.verifiedByUserId as string) || undefined,
    verifiedAt: (document.verifiedAt as string) || undefined,
    evidenceDocumentIds: (document.evidenceDocumentIds as string[]) || [],
  };
}

export class AppwriteAuditFindingRepository implements AuditFindingRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly AuditFinding[]> {
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
    return result.documents.map((doc) => toAuditFinding(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<AuditFinding | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const finding = toAuditFinding(doc as Record<string, unknown>);
      if (finding.matId !== scope.matId) return null;
      if (scope.academyId && finding.academyId !== scope.academyId) return null;
      return finding;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, finding: AuditFinding): Promise<AuditFinding> {
    if (finding.matId !== scope.matId) throw new Error("Audit finding is outside the authorised scope");
    if (scope.academyId && finding.academyId !== scope.academyId) {
      throw new Error("Audit finding is outside the authorised scope");
    }

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("auditProgrammeId", finding.auditProgrammeId),
        Query.limit(100),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === finding.id);

    const data = {
      matId: scope.matId,
      academyId: finding.academyId ?? null,
      auditProgrammeId: finding.auditProgrammeId,
      title: finding.title,
      description: finding.description,
      rating: finding.rating,
      rootCause: finding.rootCause,
      recommendation: finding.recommendation,
      managementResponse: finding.managementResponse ?? null,
      ownerUserId: finding.ownerUserId,
      dueAt: finding.dueAt,
      status: finding.status,
      verifiedByUserId: finding.verifiedByUserId ?? null,
      verifiedAt: finding.verifiedAt ?? null,
      evidenceDocumentIds: JSON.stringify(finding.evidenceDocumentIds),
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toAuditFinding(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      finding.id || ID.unique(),
      data
    );
    return toAuditFinding(doc as Record<string, unknown>);
  }
}
