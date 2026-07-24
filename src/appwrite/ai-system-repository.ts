import { ID, Query, type Databases } from "node-appwrite";
import type { AiSystemRecord } from "@/src/domain/advanced-governance";
import type { TenantScope } from "@/src/domain/model";

export interface AiSystemRepository {
  list(scope: TenantScope): Promise<readonly AiSystemRecord[]>;
  findById(scope: TenantScope, id: string): Promise<AiSystemRecord | null>;
  save(scope: TenantScope, system: AiSystemRecord): Promise<AiSystemRecord>;
}

function toAiSystemRecord(document: Record<string, unknown>): AiSystemRecord {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    name: document.name as string,
    purpose: document.purpose as string,
    ownerUserId: document.ownerUserId as string,
    supplierId: (document.supplierId as string) || undefined,
    modelProvider: document.modelProvider as string,
    modelReference: document.modelReference as string,
    riskTier: document.riskTier as AiSystemRecord["riskTier"],
    status: document.status as AiSystemRecord["status"],
    personalDataUsed: document.personalDataUsed as boolean,
    specialCategoryDataUsed: document.specialCategoryDataUsed as boolean,
    automatedDecisionSignificantEffect: document.automatedDecisionSignificantEffect as boolean,
    humanOversightDescription: document.humanOversightDescription as string,
    explainabilityDescription: document.explainabilityDescription as string,
    trainingDataDescription: (document.trainingDataDescription as string) || undefined,
    dpiaId: (document.dpiaId as string) || undefined,
    supplierAssessmentId: (document.supplierAssessmentId as string) || undefined,
    monitoringMetrics: (document.monitoringMetrics as string[]) || [],
    reviewDueAt: document.reviewDueAt as string,
    approvedByUserId: (document.approvedByUserId as string) || undefined,
    approvalRationale: (document.approvalRationale as string) || undefined,
  };
}

export class AppwriteAiSystemRepository implements AiSystemRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly AiSystemRecord[]> {
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
    return result.documents.map((doc) => toAiSystemRecord(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<AiSystemRecord | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const system = toAiSystemRecord(doc as Record<string, unknown>);
      if (system.matId !== scope.matId) return null;
      return system;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, system: AiSystemRecord): Promise<AiSystemRecord> {
    if (system.matId !== scope.matId) throw new Error("AI system is outside the authorised scope");

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("name", system.name),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === system.id);

    const data = {
      matId: scope.matId,
      name: system.name,
      purpose: system.purpose,
      ownerUserId: system.ownerUserId,
      supplierId: system.supplierId ?? null,
      modelProvider: system.modelProvider,
      modelReference: system.modelReference,
      riskTier: system.riskTier,
      status: system.status,
      personalDataUsed: system.personalDataUsed,
      specialCategoryDataUsed: system.specialCategoryDataUsed,
      automatedDecisionSignificantEffect: system.automatedDecisionSignificantEffect,
      humanOversightDescription: system.humanOversightDescription,
      explainabilityDescription: system.explainabilityDescription,
      trainingDataDescription: system.trainingDataDescription ?? null,
      dpiaId: system.dpiaId ?? null,
      supplierAssessmentId: system.supplierAssessmentId ?? null,
      monitoringMetrics: JSON.stringify(system.monitoringMetrics),
      reviewDueAt: system.reviewDueAt,
      approvedByUserId: system.approvedByUserId ?? null,
      approvalRationale: system.approvalRationale ?? null,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toAiSystemRecord(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      system.id || ID.unique(),
      data
    );
    return toAiSystemRecord(doc as Record<string, unknown>);
  }
}
