import { ID, Query, type Databases } from "node-appwrite";
import type { ContractGovernanceRecord } from "@/src/domain/advanced-governance";
import type { TenantScope } from "@/src/domain/model";

export interface ContractGovernanceRepository {
  list(scope: TenantScope): Promise<readonly ContractGovernanceRecord[]>;
  findById(scope: TenantScope, id: string): Promise<ContractGovernanceRecord | null>;
  save(scope: TenantScope, contract: ContractGovernanceRecord): Promise<ContractGovernanceRecord>;
}

function toContractGovernanceRecord(document: Record<string, unknown>): ContractGovernanceRecord {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    supplierId: document.supplierId as string,
    title: document.title as string,
    ownerUserId: document.ownerUserId as string,
    startsAt: document.startsAt as string,
    expiresAt: document.expiresAt as string,
    renewalNoticeAt: document.renewalNoticeAt as string,
    dataProcessingTerms: document.dataProcessingTerms as boolean,
    confidentialityTerms: document.confidentialityTerms as boolean,
    auditRights: document.auditRights as boolean,
    subprocessorApprovalRequired: document.subprocessorApprovalRequired as boolean,
    breachNotificationHours: (document.breachNotificationHours as number) || undefined,
    returnOrDeletionTerms: document.returnOrDeletionTerms as boolean,
    exitPlanDocumentId: (document.exitPlanDocumentId as string) || undefined,
    status: document.status as ContractGovernanceRecord["status"],
    offboardingCompletedAt: (document.offboardingCompletedAt as string) || undefined,
    deletionEvidenceDocumentId: (document.deletionEvidenceDocumentId as string) || undefined,
  };
}

export class AppwriteContractGovernanceRepository implements ContractGovernanceRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly ContractGovernanceRecord[]> {
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
    return result.documents.map((doc) => toContractGovernanceRecord(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<ContractGovernanceRecord | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const contract = toContractGovernanceRecord(doc as Record<string, unknown>);
      if (contract.matId !== scope.matId) return null;
      return contract;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, contract: ContractGovernanceRecord): Promise<ContractGovernanceRecord> {
    if (contract.matId !== scope.matId) throw new Error("Contract governance record is outside the authorised scope");

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("supplierId", contract.supplierId),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === contract.id);

    const data = {
      matId: scope.matId,
      supplierId: contract.supplierId,
      title: contract.title,
      ownerUserId: contract.ownerUserId,
      startsAt: contract.startsAt,
      expiresAt: contract.expiresAt,
      renewalNoticeAt: contract.renewalNoticeAt,
      dataProcessingTerms: contract.dataProcessingTerms,
      confidentialityTerms: contract.confidentialityTerms,
      auditRights: contract.auditRights,
      subprocessorApprovalRequired: contract.subprocessorApprovalRequired,
      breachNotificationHours: contract.breachNotificationHours ?? null,
      returnOrDeletionTerms: contract.returnOrDeletionTerms,
      exitPlanDocumentId: contract.exitPlanDocumentId ?? null,
      status: contract.status,
      offboardingCompletedAt: contract.offboardingCompletedAt ?? null,
      deletionEvidenceDocumentId: contract.deletionEvidenceDocumentId ?? null,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toContractGovernanceRecord(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      contract.id || ID.unique(),
      data
    );
    return toContractGovernanceRecord(doc as Record<string, unknown>);
  }
}
