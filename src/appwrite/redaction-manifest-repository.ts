import { ID, Query, type Databases } from "node-appwrite";
import type { TenantScope } from "@/src/domain/model";

export interface RedactionManifest {
  id: string;
  matId: string;
  academyId?: string;
  matterId: string;
  documentId: string;
  documentVersion: number;
  originalChecksum: string;
  redactedCopyDocumentId: string;
  redactedCopyChecksum: string;
  generatedAt: string;
  generatedByUserId: string;
  entries: readonly Record<string, unknown>[];
  manifestHash: string;
}

export interface RedactionManifestRepository {
  listByMatterAndDocument(scope: TenantScope, matterId: string, documentId: string): Promise<readonly RedactionManifest[]>;
  findById(scope: TenantScope, id: string): Promise<RedactionManifest | null>;
  save(scope: TenantScope, manifest: RedactionManifest): Promise<RedactionManifest>;
}

function toRedactionManifest(document: Record<string, unknown>): RedactionManifest {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    matterId: document.matterId as string,
    documentId: document.documentId as string,
    documentVersion: document.documentVersion as number,
    originalChecksum: document.originalChecksum as string,
    redactedCopyDocumentId: document.redactedCopyDocumentId as string,
    redactedCopyChecksum: document.redactedCopyChecksum as string,
    generatedAt: document.generatedAt as string,
    generatedByUserId: document.generatedByUserId as string,
    entries: (typeof document.entries === "string" ? JSON.parse(document.entries) : document.entries) || [],
    manifestHash: document.manifestHash as string,
  };
}

export class AppwriteRedactionManifestRepository implements RedactionManifestRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async listByMatterAndDocument(scope: TenantScope, matterId: string, documentId: string): Promise<readonly RedactionManifest[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("matterId", matterId),
      Query.equal("documentId", documentId),
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
    return result.documents.map((doc) => toRedactionManifest(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<RedactionManifest | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const manifest = toRedactionManifest(doc as Record<string, unknown>);
      if (manifest.matId !== scope.matId) return null;
      if (scope.academyId && manifest.academyId !== scope.academyId) return null;
      return manifest;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, manifest: RedactionManifest): Promise<RedactionManifest> {
    if (manifest.matId !== scope.matId) throw new Error("Redaction manifest is outside the authorised scope");
    if (scope.academyId && manifest.academyId !== scope.academyId) {
      throw new Error("Redaction manifest is outside the authorised scope");
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      manifest.id || ID.unique(),
      {
        matId: scope.matId,
        academyId: scope.academyId ?? null,
        matterId: manifest.matterId,
        documentId: manifest.documentId,
        documentVersion: manifest.documentVersion,
        originalChecksum: manifest.originalChecksum,
        redactedCopyDocumentId: manifest.redactedCopyDocumentId,
        redactedCopyChecksum: manifest.redactedCopyChecksum,
        generatedAt: manifest.generatedAt,
        generatedByUserId: manifest.generatedByUserId,
        entries: JSON.stringify(manifest.entries),
        manifestHash: manifest.manifestHash,
      }
    );
    return toRedactionManifest(doc as Record<string, unknown>);
  }
}
