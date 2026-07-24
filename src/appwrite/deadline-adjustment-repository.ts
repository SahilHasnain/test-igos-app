import { ID, Query, type Databases } from "node-appwrite";
import type { DeadlineAdjustment } from "@/src/domain/deadline-adjustments";
import type { TenantScope } from "@/src/domain/model";

export interface DeadlineAdjustmentRepository {
  listByMatterId(scope: TenantScope, matterId: string): Promise<readonly DeadlineAdjustment[]>;
  save(scope: TenantScope, matterId: string, adjustment: DeadlineAdjustment): Promise<DeadlineAdjustment>;
}

function toAdjustment(document: Record<string, unknown>): DeadlineAdjustment {
  const base = {
    id: document.$id as string,
    matterId: document.matterId as string,
    kind: document.kind as "extension" | "pause",
    reason: document.reason as string,
    recordedByUserId: document.recordedByUserId as string,
    rationale: document.rationale as string,
  };

  if (base.kind === "extension") {
    return {
      ...base,
      kind: "extension",
      reason: base.reason as "sar-complexity-extension" | "manual-correction",
      recordedAt: document.recordedAt as string,
      originalDueAt: document.originalDueAt as string,
      revisedDueAt: document.revisedDueAt as string,
      approvedByUserId: (document.approvedByUserId as string) || undefined,
    };
  }

  return {
    ...base,
    kind: "pause",
    reason: base.reason as "sar-identity-evidence" | "sar-fee-payment" | "foi-clarification",
    startedAt: document.startedAt as string,
    resumedAt: (document.resumedAt as string) || undefined,
  };
}

export class AppwriteDeadlineAdjustmentRepository implements DeadlineAdjustmentRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async listByMatterId(scope: TenantScope, matterId: string): Promise<readonly DeadlineAdjustment[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("matterId", matterId),
      Query.orderAsc("createdAt"),
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
    return result.documents.map((doc) => toAdjustment(doc as Record<string, unknown>));
  }

  async save(scope: TenantScope, matterId: string, adjustment: DeadlineAdjustment): Promise<DeadlineAdjustment> {
    const document = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      ID.unique(),
      {
        matId: scope.matId,
        academyId: scope.academyId ?? null,
        matterId,
        kind: adjustment.kind,
        reason: adjustment.reason,
        rationale: adjustment.rationale,
        recordedByUserId: adjustment.recordedByUserId,
        recordedAt: adjustment.kind === "extension" ? adjustment.recordedAt : new Date().toISOString(),
        originalDueAt: adjustment.kind === "extension" ? adjustment.originalDueAt : null,
        revisedDueAt: adjustment.kind === "extension" ? adjustment.revisedDueAt : null,
        approvedByUserId: adjustment.kind === "extension" ? (adjustment.approvedByUserId ?? null) : null,
        startedAt: adjustment.kind === "pause" ? adjustment.startedAt : null,
        resumedAt: adjustment.kind === "pause" ? (adjustment.resumedAt ?? null) : null,
        createdAt: new Date().toISOString(),
      }
    );
    return toAdjustment(document as Record<string, unknown>);
  }
}
