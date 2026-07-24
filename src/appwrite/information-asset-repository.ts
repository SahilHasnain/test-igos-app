import { ID, Query, type Databases } from "node-appwrite";
import type { InformationAsset } from "@/src/domain/advanced-governance";
import type { TenantScope } from "@/src/domain/model";

export interface InformationAssetRepository {
  list(scope: TenantScope): Promise<readonly InformationAsset[]>;
  findById(scope: TenantScope, id: string): Promise<InformationAsset | null>;
  save(scope: TenantScope, asset: InformationAsset): Promise<InformationAsset>;
}

function toInformationAsset(document: Record<string, unknown>): InformationAsset {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyIds: (document.academyIds as string[]) || [],
    name: document.name as string,
    assetType: document.assetType as InformationAsset["assetType"],
    ownerUserId: document.ownerUserId as string,
    administratorUserId: (document.administratorUserId as string) || undefined,
    classification: document.classification as InformationAsset["classification"],
    criticality: document.criticality as InformationAsset["criticality"],
    hostingLocations: (document.hostingLocations as string[]) || [],
    containsPersonalData: document.containsPersonalData as boolean,
    containsSpecialCategoryData: document.containsSpecialCategoryData as boolean,
    ropaActivityIds: (document.ropaActivityIds as string[]) || [],
    dpiaIds: (document.dpiaIds as string[]) || [],
    supplierIds: (document.supplierIds as string[]) || [],
    retentionRuleIds: (document.retentionRuleIds as string[]) || [],
    recoveryTimeHours: (document.recoveryTimeHours as number) || undefined,
    recoveryPointHours: (document.recoveryPointHours as number) || undefined,
    lastReviewedAt: (document.lastReviewedAt as string) || undefined,
    nextReviewAt: document.nextReviewAt as string,
    status: document.status as InformationAsset["status"],
  };
}

export class AppwriteInformationAssetRepository implements InformationAssetRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly InformationAsset[]> {
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
    return result.documents.map((doc) => toInformationAsset(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<InformationAsset | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const asset = toInformationAsset(doc as Record<string, unknown>);
      if (asset.matId !== scope.matId) return null;
      if (scope.academyId && !asset.academyIds.includes(scope.academyId)) return null;
      return asset;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, asset: InformationAsset): Promise<InformationAsset> {
    if (asset.matId !== scope.matId) throw new Error("Information asset is outside the authorised scope");
    if (scope.academyId && !asset.academyIds.includes(scope.academyId)) {
      throw new Error("Information asset is outside the authorised scope");
    }

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("name", asset.name),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === asset.id);

    const data = {
      matId: scope.matId,
      academyIds: JSON.stringify(asset.academyIds),
      name: asset.name,
      assetType: asset.assetType,
      ownerUserId: asset.ownerUserId,
      administratorUserId: asset.administratorUserId ?? null,
      classification: asset.classification,
      criticality: asset.criticality,
      hostingLocations: JSON.stringify(asset.hostingLocations),
      containsPersonalData: asset.containsPersonalData,
      containsSpecialCategoryData: asset.containsSpecialCategoryData,
      ropaActivityIds: JSON.stringify(asset.ropaActivityIds),
      dpiaIds: JSON.stringify(asset.dpiaIds),
      supplierIds: JSON.stringify(asset.supplierIds),
      retentionRuleIds: JSON.stringify(asset.retentionRuleIds),
      recoveryTimeHours: asset.recoveryTimeHours ?? null,
      recoveryPointHours: asset.recoveryPointHours ?? null,
      lastReviewedAt: asset.lastReviewedAt ?? null,
      nextReviewAt: asset.nextReviewAt,
      status: asset.status,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toInformationAsset(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      asset.id || ID.unique(),
      data
    );
    return toInformationAsset(doc as Record<string, unknown>);
  }
}
