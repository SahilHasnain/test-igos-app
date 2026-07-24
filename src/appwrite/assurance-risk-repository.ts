import { ID, Query, type Databases } from "node-appwrite";
import type { AssuranceRisk } from "@/src/domain/assurance";
import type { TenantScope } from "@/src/domain/model";

export interface AssuranceRiskRepository {
  list(scope: TenantScope): Promise<readonly AssuranceRisk[]>;
  findById(scope: TenantScope, id: string): Promise<AssuranceRisk | null>;
  save(scope: TenantScope, risk: AssuranceRisk): Promise<AssuranceRisk>;
}

function toAssuranceRisk(document: Record<string, unknown>): AssuranceRisk {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    title: document.title as string,
    description: document.description as string,
    category: document.category as AssuranceRisk["category"],
    ownerUserId: document.ownerUserId as string,
    likelihood: document.likelihood as AssuranceRisk["likelihood"],
    impact: document.impact as AssuranceRisk["impact"],
    controlEffectiveness: document.controlEffectiveness as number,
    controls: (document.controls as string[]) || [],
    treatments: (document.treatments as string[]) || [],
    appetite: document.appetite as AssuranceRisk["appetite"],
    reviewDueAt: document.reviewDueAt as string,
    status: document.status as AssuranceRisk["status"],
    acceptedByUserId: (document.acceptedByUserId as string) || undefined,
    acceptanceRationale: (document.acceptanceRationale as string) || undefined,
  };
}

export class AppwriteAssuranceRiskRepository implements AssuranceRiskRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly AssuranceRisk[]> {
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
    return result.documents.map((doc) => toAssuranceRisk(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<AssuranceRisk | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const risk = toAssuranceRisk(doc as Record<string, unknown>);
      if (risk.matId !== scope.matId) return null;
      if (scope.academyId && risk.academyId !== scope.academyId) return null;
      return risk;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, risk: AssuranceRisk): Promise<AssuranceRisk> {
    if (risk.matId !== scope.matId) throw new Error("Assurance risk is outside the authorised scope");
    if (scope.academyId && risk.academyId !== scope.academyId) {
      throw new Error("Assurance risk is outside the authorised scope");
    }

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("title", risk.title),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === risk.id);

    const data = {
      matId: scope.matId,
      academyId: risk.academyId ?? null,
      title: risk.title,
      description: risk.description,
      category: risk.category,
      ownerUserId: risk.ownerUserId,
      likelihood: risk.likelihood,
      impact: risk.impact,
      controlEffectiveness: risk.controlEffectiveness,
      controls: JSON.stringify(risk.controls),
      treatments: JSON.stringify(risk.treatments),
      appetite: risk.appetite,
      reviewDueAt: risk.reviewDueAt,
      status: risk.status,
      acceptedByUserId: risk.acceptedByUserId ?? null,
      acceptanceRationale: risk.acceptanceRationale ?? null,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toAssuranceRisk(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      risk.id || ID.unique(),
      data
    );
    return toAssuranceRisk(doc as Record<string, unknown>);
  }
}
