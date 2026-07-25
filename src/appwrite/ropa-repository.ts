import { ID, Query, type Databases } from "node-appwrite";
import type { ProcessingActivity } from "@/src/domain/ropa";
import type { TenantScope } from "@/src/domain/model";
import type { RopaRepository } from "@/src/repositories/governance-repository";

function toProcessingActivity(document: Record<string, unknown>): ProcessingActivity {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyIds: (document.academyIds as string[]) || [],
    name: document.name as string,
    ownerUserId: document.ownerUserId as string,
    purpose: document.purpose as string,
    dataSubjectCategories: (document.dataSubjectCategories as string[]) || [],
    personalDataCategories: (document.personalDataCategories as string[]) || [],
    specialCategoryData: document.specialCategoryData as boolean,
    criminalOffenceData: document.criminalOffenceData as boolean,
    lawfulBasis: document.lawfulBasis as ProcessingActivity["lawfulBasis"],
    specialCategoryCondition: (document.specialCategoryCondition as ProcessingActivity["specialCategoryCondition"]) || undefined,
    recipients: (document.recipients as string[]) || [],
    processors: (document.processors as string[]) || [],
    internationalTransfers: (typeof document.internationalTransfers === "string"
      ? JSON.parse(document.internationalTransfers)
      : document.internationalTransfers) || [],
    retentionRule: document.retentionRule as string,
    securityMeasures: (document.securityMeasures as string[]) || [],
    sourceSystems: (document.sourceSystems as string[]) || [],
    destinationSystems: (document.destinationSystems as string[]) || [],
    status: document.status as ProcessingActivity["status"],
    lastReviewedAt: (document.lastReviewedAt as string) || undefined,
    nextReviewAt: document.nextReviewAt as string,
  };
}

export class AppwriteRopaRepository implements RopaRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly ProcessingActivity[]> {
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
    return result.documents
      .map((doc) => toProcessingActivity(doc as Record<string, unknown>))
      .filter((activity) => !scope.academyId || activity.academyIds.includes(scope.academyId));
  }

  async findById(scope: TenantScope, id: string): Promise<ProcessingActivity | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const activity = toProcessingActivity(doc as Record<string, unknown>);
      if (activity.matId !== scope.matId) return null;
      if (scope.academyId && !activity.academyIds.includes(scope.academyId)) return null;
      return activity;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, activity: ProcessingActivity): Promise<ProcessingActivity> {
    if (activity.matId !== scope.matId) throw new Error("Processing activity is outside the authorised scope");
    if (scope.academyId && !activity.academyIds.includes(scope.academyId)) {
      throw new Error("Processing activity is outside the authorised scope");
    }

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("name", activity.name),
        Query.limit(1),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === activity.id);

    const data = {
      matId: scope.matId,
      academyIds: activity.academyIds,
      name: activity.name,
      ownerUserId: activity.ownerUserId,
      purpose: activity.purpose,
      dataSubjectCategories: activity.dataSubjectCategories,
      personalDataCategories: activity.personalDataCategories,
      specialCategoryData: activity.specialCategoryData,
      criminalOffenceData: activity.criminalOffenceData,
      lawfulBasis: activity.lawfulBasis,
      specialCategoryCondition: activity.specialCategoryCondition ?? null,
      recipients: activity.recipients,
      processors: activity.processors,
      internationalTransfers: JSON.stringify(activity.internationalTransfers),
      retentionRule: activity.retentionRule,
      securityMeasures: activity.securityMeasures,
      sourceSystems: activity.sourceSystems,
      destinationSystems: activity.destinationSystems,
      status: activity.status,
      lastReviewedAt: activity.lastReviewedAt ?? null,
      nextReviewAt: activity.nextReviewAt,
      version: 1,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toProcessingActivity(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      activity.id || ID.unique(),
      data
    );
    return toProcessingActivity(doc as Record<string, unknown>);
  }
}
