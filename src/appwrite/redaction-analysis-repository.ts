import { ID, Query, type Databases } from "node-appwrite";
import type { TenantScope } from "@/src/domain/model";

export interface RedactionAnalysisRun {
  id: string;
  matId: string;
  academyId?: string;
  matterId: string;
  documentId: string;
  documentVersion: number;
  provider: string;
  processingLocation: string;
  modelReference?: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  suggestionCount: number;
  inputChecksum: string;
}

export interface RedactionAnalysisRepository {
  list(scope: TenantScope, matterId: string): Promise<readonly RedactionAnalysisRun[]>;
  findById(scope: TenantScope, id: string): Promise<RedactionAnalysisRun | null>;
  save(scope: TenantScope, run: RedactionAnalysisRun): Promise<RedactionAnalysisRun>;
}

function toRedactionAnalysisRun(document: Record<string, unknown>): RedactionAnalysisRun {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    matterId: document.matterId as string,
    documentId: document.documentId as string,
    documentVersion: document.documentVersion as number,
    provider: document.provider as string,
    processingLocation: document.processingLocation as string,
    modelReference: (document.modelReference as string) || undefined,
    startedAt: document.startedAt as string,
    completedAt: (document.completedAt as string) || undefined,
    status: document.status as string,
    suggestionCount: document.suggestionCount as number,
    inputChecksum: document.inputChecksum as string,
  };
}

export class AppwriteRedactionAnalysisRepository implements RedactionAnalysisRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope, matterId: string): Promise<readonly RedactionAnalysisRun[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("matterId", matterId),
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
    return result.documents.map((doc) => toRedactionAnalysisRun(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<RedactionAnalysisRun | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const run = toRedactionAnalysisRun(doc as Record<string, unknown>);
      if (run.matId !== scope.matId) return null;
      if (scope.academyId && run.academyId !== scope.academyId) return null;
      return run;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, run: RedactionAnalysisRun): Promise<RedactionAnalysisRun> {
    if (run.matId !== scope.matId) throw new Error("Redaction analysis run is outside the authorised scope");
    if (scope.academyId && run.academyId !== scope.academyId) {
      throw new Error("Redaction analysis run is outside the authorised scope");
    }

    const data = {
      matId: scope.matId,
      academyId: scope.academyId ?? null,
      matterId: run.matterId,
      documentId: run.documentId,
      documentVersion: run.documentVersion,
      provider: run.provider,
      processingLocation: run.processingLocation,
      modelReference: run.modelReference ?? null,
      startedAt: run.startedAt,
      completedAt: run.completedAt ?? null,
      status: run.status,
      suggestionCount: run.suggestionCount,
      inputChecksum: run.inputChecksum,
    };

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      run.id || ID.unique(),
      data
    );
    return toRedactionAnalysisRun(doc as Record<string, unknown>);
  }
}
