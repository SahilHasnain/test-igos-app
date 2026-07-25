import { ID, Query, type Databases } from "node-appwrite";
import type { DpiaSection, DpiaRisk } from "@/src/domain/dpia";
import type { TenantScope } from "@/src/domain/model";
import type { DpiaRepository } from "@/src/repositories/governance-repository";

function toDpiaSection(document: Record<string, unknown>): DpiaSection {
  return {
    id: document.sectionKey as string,
    title: document.title as string,
    assignedRole: document.assignedRole as DpiaSection["assignedRole"],
    assignedUserId: (document.assignedUserId as string) || undefined,
    status: document.status as DpiaSection["status"],
    answers: (typeof document.answers === "string" ? JSON.parse(document.answers) : document.answers) || {},
    submittedAt: (document.submittedAt as string) || undefined,
    acceptedAt: (document.acceptedAt as string) || undefined,
  };
}

function toDpiaRisk(document: Record<string, unknown>): DpiaRisk {
  return {
    id: document.$id as string,
    description: document.description as string,
    affectedPeople: (document.affectedPeople as string[]) || [],
    likelihood: document.likelihood as DpiaRisk["likelihood"],
    impact: document.impact as DpiaRisk["impact"],
    controlEffectiveness: document.controlEffectiveness as number,
    mitigations: (document.mitigations as string[]) || [],
    ownerUserId: document.ownerUserId as string,
    dueAt: (document.dueAt as string) || undefined,
    acceptedByUserId: (document.acceptedByUserId as string) || undefined,
    acceptanceRationale: (document.acceptanceRationale as string) || undefined,
  };
}

export class AppwriteDpiaRepository implements DpiaRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly sectionsCollectionId: string,
    private readonly risksCollectionId: string
  ) {}

  async listSections(scope: TenantScope, matterId: string): Promise<readonly DpiaSection[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("matterId", matterId),
      Query.orderAsc("$createdAt"),
      Query.limit(100),
    ];
    if (scope.academyId) {
      queries.push(Query.equal("academyId", scope.academyId));
    }
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.sectionsCollectionId,
      queries
    );
    return result.documents.map((doc) => toDpiaSection(doc as Record<string, unknown>));
  }

  async saveSection(scope: TenantScope, matterId: string, section: DpiaSection): Promise<DpiaSection> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("matterId", matterId),
      Query.equal("sectionKey", section.id),
      Query.limit(1),
    ];
    if (scope.academyId) {
      queries.push(Query.equal("academyId", scope.academyId));
    }
    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.sectionsCollectionId,
      queries
    );

    const data = {
      matId: scope.matId,
      academyId: scope.academyId ?? null,
      matterId,
      sectionKey: section.id,
      title: section.title,
      assignedRole: section.assignedRole,
      assignedUserId: section.assignedUserId ?? null,
      status: section.status,
      answers: JSON.stringify(section.answers),
      submittedAt: section.submittedAt ?? null,
      acceptedAt: section.acceptedAt ?? null,
      version: (existing.documents[0]?.version as number ?? 0) + 1,
    };

    if (existing.documents.length > 0) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.sectionsCollectionId,
        existing.documents[0].$id,
        data
      );
      return toDpiaSection(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.sectionsCollectionId,
      ID.unique(),
      data
    );
    return toDpiaSection(doc as Record<string, unknown>);
  }

  async listRisks(scope: TenantScope, matterId: string): Promise<readonly DpiaRisk[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("matterId", matterId),
      Query.limit(100),
    ];
    if (scope.academyId) {
      queries.push(Query.equal("academyId", scope.academyId));
    }
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.risksCollectionId,
      queries
    );
    return result.documents.map((doc) => toDpiaRisk(doc as Record<string, unknown>));
  }

  async saveRisk(scope: TenantScope, matterId: string, risk: DpiaRisk): Promise<DpiaRisk> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("matterId", matterId),
      Query.limit(100),
    ];
    if (scope.academyId) {
      queries.push(Query.equal("academyId", scope.academyId));
    }
    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.risksCollectionId,
      queries
    );
    const found = existing.documents.find((doc) => doc.$id === risk.id);

    const data = {
      matId: scope.matId,
      academyId: scope.academyId ?? null,
      matterId,
      description: risk.description,
      affectedPeople: risk.affectedPeople,
      likelihood: risk.likelihood,
      impact: risk.impact,
      controlEffectiveness: risk.controlEffectiveness,
      mitigations: risk.mitigations,
      ownerUserId: risk.ownerUserId,
      dueAt: risk.dueAt ?? null,
      acceptedByUserId: risk.acceptedByUserId ?? null,
      acceptanceRationale: risk.acceptanceRationale ?? null,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.risksCollectionId,
        found.$id,
        data
      );
      return toDpiaRisk(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.risksCollectionId,
      risk.id || ID.unique(),
      data
    );
    return toDpiaRisk(doc as Record<string, unknown>);
  }
}
