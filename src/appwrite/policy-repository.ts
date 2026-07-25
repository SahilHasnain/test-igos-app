import { ID, Query, type Databases } from "node-appwrite";
import type { PolicyRecord, PolicyAcknowledgement, PolicyException } from "@/src/domain/policy";
import type { TenantScope } from "@/src/domain/model";
import type { PolicyRepository } from "@/src/repositories/governance-repository";

function toPolicyRecord(document: Record<string, unknown>): PolicyRecord {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyIds: (document.academyIds as string[]) || [],
    title: document.title as string,
    ownerUserId: document.ownerUserId as string,
    version: document.versionLabel as string,
    status: document.status as PolicyRecord["status"],
    reviewDueAt: document.reviewDueAt as string,
    documentId: document.documentId as string,
    approvedByUserId: (document.approvedByUserId as string) || undefined,
    approvedAt: (document.approvedAt as string) || undefined,
    publishedAt: (document.publishedAt as string) || undefined,
    supersedesPolicyId: (document.supersedesPolicyId as string) || undefined,
  };
}

function toAcknowledgement(document: Record<string, unknown>): PolicyAcknowledgement {
  return {
    id: document.$id as string,
    policyId: document.policyId as string,
    policyVersion: document.policyVersion as string,
    userId: document.userId as string,
    assignedAt: document.assignedAt as string,
    dueAt: document.dueAt as string,
    acknowledgedAt: (document.acknowledgedAt as string) || undefined,
    exceptionId: (document.exceptionId as string) || undefined,
  };
}

function toException(document: Record<string, unknown>): PolicyException {
  return {
    id: document.$id as string,
    policyId: document.policyId as string,
    academyId: (document.academyId as string) || undefined,
    requestedByUserId: document.requestedByUserId as string,
    rationale: document.rationale as string,
    compensatingControls: (document.compensatingControls as string[]) || [],
    expiresAt: document.expiresAt as string,
    approvedByUserId: (document.approvedByUserId as string) || undefined,
    approvedAt: (document.approvedAt as string) || undefined,
  };
}

export class AppwritePolicyRepository implements PolicyRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly policiesCollectionId: string,
    private readonly acknowledgementsCollectionId: string,
    private readonly exceptionsCollectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly PolicyRecord[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ];
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.policiesCollectionId,
      queries
    );
    return result.documents
      .map((doc) => toPolicyRecord(doc as Record<string, unknown>))
      .filter((policy) => !scope.academyId || policy.academyIds.includes(scope.academyId));
  }

  async findById(scope: TenantScope, id: string): Promise<PolicyRecord | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.policiesCollectionId,
        id
      );
      const policy = toPolicyRecord(doc as Record<string, unknown>);
      if (policy.matId !== scope.matId) return null;
      if (scope.academyId && !policy.academyIds.includes(scope.academyId)) return null;
      return policy;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, policy: PolicyRecord): Promise<PolicyRecord> {
    if (policy.matId !== scope.matId) throw new Error("Policy is outside the authorised scope");
    if (scope.academyId && !policy.academyIds.includes(scope.academyId)) {
      throw new Error("Policy is outside the authorised scope");
    }

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.policiesCollectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("title", policy.title),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === policy.id);

    const data = {
      matId: scope.matId,
      academyIds: policy.academyIds,
      title: policy.title,
      ownerUserId: policy.ownerUserId,
      versionLabel: policy.version,
      status: policy.status,
      reviewDueAt: policy.reviewDueAt,
      documentId: policy.documentId,
      approvedByUserId: policy.approvedByUserId ?? null,
      approvedAt: policy.approvedAt ?? null,
      publishedAt: policy.publishedAt ?? null,
      supersedesPolicyId: policy.supersedesPolicyId ?? null,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.policiesCollectionId,
        found.$id,
        data
      );
      return toPolicyRecord(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.policiesCollectionId,
      policy.id || ID.unique(),
      data
    );
    return toPolicyRecord(doc as Record<string, unknown>);
  }

  async listAcknowledgements(scope: TenantScope, policyId: string): Promise<readonly PolicyAcknowledgement[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("policyId", policyId),
      Query.limit(100),
    ];
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.acknowledgementsCollectionId,
      queries
    );
    return result.documents.map((doc) => toAcknowledgement(doc as Record<string, unknown>));
  }

  async saveAcknowledgement(scope: TenantScope, acknowledgement: PolicyAcknowledgement): Promise<PolicyAcknowledgement> {
    const doc = await this.databases.createDocument(
      this.databaseId,
      this.acknowledgementsCollectionId,
      acknowledgement.id || ID.unique(),
      {
        matId: scope.matId,
        policyId: acknowledgement.policyId,
        policyVersion: acknowledgement.policyVersion,
        userId: acknowledgement.userId,
        assignedAt: acknowledgement.assignedAt,
        dueAt: acknowledgement.dueAt,
        acknowledgedAt: acknowledgement.acknowledgedAt ?? null,
        exceptionId: acknowledgement.exceptionId ?? null,
      }
    );
    return toAcknowledgement(doc as Record<string, unknown>);
  }

  async saveException(scope: TenantScope, exception: PolicyException): Promise<PolicyException> {
    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.exceptionsCollectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("policyId", exception.policyId),
        Query.limit(100),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === exception.id);

    const data = {
      matId: scope.matId,
      academyId: scope.academyId ?? null,
      policyId: exception.policyId,
      requestedByUserId: exception.requestedByUserId,
      rationale: exception.rationale,
      compensatingControls: exception.compensatingControls,
      expiresAt: exception.expiresAt,
      approvedByUserId: exception.approvedByUserId ?? null,
      approvedAt: exception.approvedAt ?? null,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.exceptionsCollectionId,
        found.$id,
        data
      );
      return toException(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.exceptionsCollectionId,
      exception.id || ID.unique(),
      data
    );
    return toException(doc as Record<string, unknown>);
  }
}
