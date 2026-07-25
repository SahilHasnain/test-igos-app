import { ID, Query, type Databases } from "node-appwrite";
import type { SupplierAssessment, TransferAssessment } from "@/src/domain/supplier";
import type { TenantScope } from "@/src/domain/model";

export interface SupplierRepository {
  listAssessments(scope: TenantScope): Promise<readonly SupplierAssessment[]>;
  findAssessmentById(scope: TenantScope, id: string): Promise<SupplierAssessment | null>;
  saveAssessment(scope: TenantScope, assessment: SupplierAssessment): Promise<SupplierAssessment>;
  listTransferAssessments(scope: TenantScope): Promise<readonly TransferAssessment[]>;
  findTransferAssessmentById(scope: TenantScope, id: string): Promise<TransferAssessment | null>;
  saveTransferAssessment(scope: TenantScope, assessment: TransferAssessment): Promise<TransferAssessment>;
}

function toSupplierAssessment(document: Record<string, unknown>): SupplierAssessment {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    supplierName: document.supplierName as string,
    serviceDescription: document.serviceDescription as string,
    relationship: document.relationship as SupplierAssessment["relationship"],
    ownerUserId: document.ownerUserId as string,
    securityQuestionnaireStatus: document.securityQuestionnaireStatus as SupplierAssessment["securityQuestionnaireStatus"],
    contractStatus: document.contractStatus as SupplierAssessment["contractStatus"],
    dataProtectionTermsConfirmed: document.dataProtectionTermsConfirmed as boolean,
    breachNotificationHours: (document.breachNotificationHours as number) || undefined,
    subprocessors: (document.subprocessors as string[]) || [],
    certifications: (document.certifications as string[]) || [],
    internationalTransfers: document.internationalTransfers as boolean,
    transferAssessmentId: (document.transferAssessmentId as string) || undefined,
    riskRating: document.riskRating as SupplierAssessment["riskRating"],
    residualRisksAcceptedByUserId: (document.residualRisksAcceptedByUserId as string) || undefined,
    residualRiskRationale: (document.residualRiskRationale as string) || undefined,
    reviewDueAt: document.reviewDueAt as string,
    status: document.status as SupplierAssessment["status"],
  };
}

function toTransferAssessment(document: Record<string, unknown>): TransferAssessment {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    supplierId: document.supplierId as string,
    destinationCountries: (document.destinationCountries as string[]) || [],
    transferMechanism: document.transferMechanism as TransferAssessment["transferMechanism"],
    dataCategories: (document.dataCategories as string[]) || [],
    supplementaryMeasures: (document.supplementaryMeasures as string[]) || [],
    localLawAssessment: document.localLawAssessment as string,
    residualRisk: document.residualRisk as TransferAssessment["residualRisk"],
    approvedByUserId: (document.approvedByUserId as string) || undefined,
    approvalRationale: (document.approvalRationale as string) || undefined,
    reviewDueAt: document.reviewDueAt as string,
  };
}

export class AppwriteSupplierRepository implements SupplierRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly assessmentsCollectionId: string,
    private readonly transfersCollectionId: string
  ) {}

  async listAssessments(scope: TenantScope): Promise<readonly SupplierAssessment[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ];
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.assessmentsCollectionId,
      queries
    );
    return result.documents.map((doc) => toSupplierAssessment(doc as Record<string, unknown>));
  }

  async findAssessmentById(scope: TenantScope, id: string): Promise<SupplierAssessment | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.assessmentsCollectionId,
        id
      );
      const assessment = toSupplierAssessment(doc as Record<string, unknown>);
      if (assessment.matId !== scope.matId) return null;
      return assessment;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async saveAssessment(scope: TenantScope, assessment: SupplierAssessment): Promise<SupplierAssessment> {
    if (assessment.matId !== scope.matId) throw new Error("Supplier assessment is outside the authorised scope");

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.assessmentsCollectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("supplierName", assessment.supplierName),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === assessment.id);

    const data = {
      matId: scope.matId,
      supplierName: assessment.supplierName,
      serviceDescription: assessment.serviceDescription,
      relationship: assessment.relationship,
      ownerUserId: assessment.ownerUserId,
      securityQuestionnaireStatus: assessment.securityQuestionnaireStatus,
      contractStatus: assessment.contractStatus,
      dataProtectionTermsConfirmed: assessment.dataProtectionTermsConfirmed,
      breachNotificationHours: assessment.breachNotificationHours ?? null,
      subprocessors: assessment.subprocessors,
      certifications: assessment.certifications,
      internationalTransfers: assessment.internationalTransfers,
      transferAssessmentId: assessment.transferAssessmentId ?? null,
      riskRating: assessment.riskRating,
      residualRisksAcceptedByUserId: assessment.residualRisksAcceptedByUserId ?? null,
      residualRiskRationale: assessment.residualRiskRationale ?? null,
      reviewDueAt: assessment.reviewDueAt,
      status: assessment.status,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.assessmentsCollectionId,
        found.$id,
        data
      );
      return toSupplierAssessment(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.assessmentsCollectionId,
      assessment.id || ID.unique(),
      data
    );
    return toSupplierAssessment(doc as Record<string, unknown>);
  }

  async listTransferAssessments(scope: TenantScope): Promise<readonly TransferAssessment[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ];
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.transfersCollectionId,
      queries
    );
    return result.documents.map((doc) => toTransferAssessment(doc as Record<string, unknown>));
  }

  async findTransferAssessmentById(scope: TenantScope, id: string): Promise<TransferAssessment | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.transfersCollectionId,
        id
      );
      const assessment = toTransferAssessment(doc as Record<string, unknown>);
      if (assessment.matId !== scope.matId) return null;
      return assessment;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async saveTransferAssessment(scope: TenantScope, assessment: TransferAssessment): Promise<TransferAssessment> {
    if (assessment.matId !== scope.matId) throw new Error("Transfer assessment is outside the authorised scope");

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.transfersCollectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("supplierId", assessment.supplierId),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === assessment.id);

    const data = {
      matId: scope.matId,
      supplierId: assessment.supplierId,
      destinationCountries: assessment.destinationCountries,
      transferMechanism: assessment.transferMechanism,
      dataCategories: assessment.dataCategories,
      supplementaryMeasures: assessment.supplementaryMeasures,
      localLawAssessment: assessment.localLawAssessment,
      residualRisk: assessment.residualRisk,
      approvedByUserId: assessment.approvedByUserId ?? null,
      approvalRationale: assessment.approvalRationale ?? null,
      reviewDueAt: assessment.reviewDueAt,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.transfersCollectionId,
        found.$id,
        data
      );
      return toTransferAssessment(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.transfersCollectionId,
      assessment.id || ID.unique(),
      data
    );
    return toTransferAssessment(doc as Record<string, unknown>);
  }
}
