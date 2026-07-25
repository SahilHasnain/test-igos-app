import { ID, Query, type Databases } from "node-appwrite";
import type { RedactionSuggestion } from "@/src/domain/redaction";
import type { TenantScope } from "@/src/domain/model";
import { parseOverflow, packOverflow } from "./mappers";

export interface RedactionSuggestionRepository {
  listByMatterAndDocument(scope: TenantScope, matterId: string, documentId: string): Promise<readonly RedactionSuggestion[]>;
  findById(scope: TenantScope, id: string): Promise<RedactionSuggestion | null>;
  save(scope: TenantScope, suggestion: RedactionSuggestion): Promise<RedactionSuggestion>;
  update(scope: TenantScope, id: string, suggestion: RedactionSuggestion): Promise<RedactionSuggestion>;
}

const OVERFLOW_KEYS = ["reviewerRationale"] as const;

function toRedactionSuggestion(document: Record<string, unknown>): RedactionSuggestion {
  const ext = parseOverflow(document);
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    matterId: document.matterId as string,
    documentId: document.documentId as string,
    documentVersion: document.documentVersion as number,
    location: (typeof document.location === "string" ? JSON.parse(document.location) : document.location) || {},
    category: document.category as RedactionSuggestion["category"],
    suggestedTreatment: document.suggestedTreatment as RedactionSuggestion["suggestedTreatment"],
    confidence: document.confidence as number,
    excerptHash: document.excerptHash as string,
    explanation: document.explanation as string,
    legalGround: (document.legalGround as string) || undefined,
    contextualFactors: (document.contextualFactors as string[]) || [],
    decision: document.decision as RedactionSuggestion["decision"],
    decidedByUserId: (document.decidedByUserId as string) || undefined,
    decidedAt: (document.decidedAt as string) || undefined,
    reviewerRationale: (ext.reviewerRationale as string) || (document.reviewerRationale as string) || undefined,
    finalTreatment: (document.finalTreatment as RedactionSuggestion["finalTreatment"]) || undefined,
  };
}

export class AppwriteRedactionSuggestionRepository implements RedactionSuggestionRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async listByMatterAndDocument(scope: TenantScope, matterId: string, documentId: string): Promise<readonly RedactionSuggestion[]> {
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
    return result.documents.map((doc) => toRedactionSuggestion(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<RedactionSuggestion | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const suggestion = toRedactionSuggestion(doc as Record<string, unknown>);
      if (suggestion.matId !== scope.matId) return null;
      if (scope.academyId && suggestion.academyId !== scope.academyId) return null;
      return suggestion;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, suggestion: RedactionSuggestion): Promise<RedactionSuggestion> {
    if (suggestion.matId !== scope.matId) throw new Error("Redaction suggestion is outside the authorised scope");
    if (scope.academyId && suggestion.academyId !== scope.academyId) {
      throw new Error("Redaction suggestion is outside the authorised scope");
    }

    const data: Record<string, unknown> = {
      matId: scope.matId,
      academyId: scope.academyId ?? null,
      matterId: suggestion.matterId,
      documentId: suggestion.documentId,
      documentVersion: suggestion.documentVersion,
      location: JSON.stringify(suggestion.location),
      category: suggestion.category,
      suggestedTreatment: suggestion.suggestedTreatment,
      confidence: suggestion.confidence,
      excerptHash: suggestion.excerptHash,
      explanation: suggestion.explanation,
      legalGround: suggestion.legalGround ?? null,
      contextualFactors: JSON.stringify(suggestion.contextualFactors),
      decision: suggestion.decision,
      decidedByUserId: suggestion.decidedByUserId ?? null,
      decidedAt: suggestion.decidedAt ?? null,
      reviewerRationale: suggestion.reviewerRationale ?? null,
      finalTreatment: suggestion.finalTreatment ?? null,
    };
    packOverflow(data, OVERFLOW_KEYS);

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      suggestion.id || ID.unique(),
      data
    );
    return toRedactionSuggestion(doc as Record<string, unknown>);
  }

  async update(scope: TenantScope, id: string, suggestion: RedactionSuggestion): Promise<RedactionSuggestion> {
    if (suggestion.matId !== scope.matId) throw new Error("Redaction suggestion is outside the authorised scope");
    if (scope.academyId && suggestion.academyId !== scope.academyId) {
      throw new Error("Redaction suggestion is outside the authorised scope");
    }

    const data: Record<string, unknown> = {
      decision: suggestion.decision,
      decidedByUserId: suggestion.decidedByUserId ?? null,
      decidedAt: suggestion.decidedAt ?? null,
      reviewerRationale: suggestion.reviewerRationale ?? null,
      finalTreatment: suggestion.finalTreatment ?? null,
    };
    packOverflow(data, OVERFLOW_KEYS);

    const doc = await this.databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      data
    );
    return toRedactionSuggestion(doc as Record<string, unknown>);
  }
}
