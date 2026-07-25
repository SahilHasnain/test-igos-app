import { ID, Query, type Databases } from "node-appwrite";
import type { AssuranceAction } from "@/src/domain/assurance";
import type { TenantScope } from "@/src/domain/model";

export interface AssuranceActionRepository {
  list(scope: TenantScope): Promise<readonly AssuranceAction[]>;
  findById(scope: TenantScope, id: string): Promise<AssuranceAction | null>;
  save(scope: TenantScope, action: AssuranceAction): Promise<AssuranceAction>;
}

function toAssuranceAction(document: Record<string, unknown>): AssuranceAction {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    sourceType: document.sourceType as AssuranceAction["sourceType"],
    sourceId: (document.sourceId as string) || undefined,
    title: document.title as string,
    description: document.description as string,
    ownerUserId: document.ownerUserId as string,
    priority: document.priority as AssuranceAction["priority"],
    status: document.status as AssuranceAction["status"],
    dueAt: document.dueAt as string,
    evidenceDocumentIds: (document.evidenceDocumentIds as string[]) || [],
    completedAt: (document.completedAt as string) || undefined,
    completedByUserId: (document.completedByUserId as string) || undefined,
    closureRationale: (document.closureRationale as string) || undefined,
  };
}

export class AppwriteAssuranceActionRepository implements AssuranceActionRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly AssuranceAction[]> {
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
    return result.documents.map((doc) => toAssuranceAction(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<AssuranceAction | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const action = toAssuranceAction(doc as Record<string, unknown>);
      if (action.matId !== scope.matId) return null;
      if (scope.academyId && action.academyId !== scope.academyId) return null;
      return action;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, action: AssuranceAction): Promise<AssuranceAction> {
    if (action.matId !== scope.matId) throw new Error("Assurance action is outside the authorised scope");
    if (scope.academyId && action.academyId !== scope.academyId) {
      throw new Error("Assurance action is outside the authorised scope");
    }

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("title", action.title),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === action.id);

    const data = {
      matId: scope.matId,
      academyId: action.academyId ?? null,
      sourceType: action.sourceType,
      sourceId: action.sourceId ?? null,
      title: action.title,
      description: action.description,
      ownerUserId: action.ownerUserId,
      priority: action.priority,
      status: action.status,
      dueAt: action.dueAt,
      evidenceDocumentIds: action.evidenceDocumentIds,
      completedAt: action.completedAt ?? null,
      completedByUserId: action.completedByUserId ?? null,
      closureRationale: action.closureRationale ?? null,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toAssuranceAction(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      action.id || ID.unique(),
      data
    );
    return toAssuranceAction(doc as Record<string, unknown>);
  }
}
