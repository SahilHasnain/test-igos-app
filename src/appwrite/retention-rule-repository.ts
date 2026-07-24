import { ID, Query, type Databases } from "node-appwrite";
import type { RetentionRule } from "@/src/domain/advanced-governance";
import type { TenantScope } from "@/src/domain/model";

export interface RetentionRuleRepository {
  list(scope: TenantScope): Promise<readonly RetentionRule[]>;
  findById(scope: TenantScope, id: string): Promise<RetentionRule | null>;
  save(scope: TenantScope, rule: RetentionRule): Promise<RetentionRule>;
}

function toRetentionRule(document: Record<string, unknown>): RetentionRule {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    name: document.name as string,
    recordCategory: document.recordCategory as string,
    trigger: document.trigger as RetentionRule["trigger"],
    periodMonths: document.periodMonths as number,
    disposition: document.disposition as RetentionRule["disposition"],
    authority: document.authority as string,
    approvedByUserId: document.approvedByUserId as string,
    effectiveAt: document.effectiveAt as string,
  };
}

export class AppwriteRetentionRuleRepository implements RetentionRuleRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async list(scope: TenantScope): Promise<readonly RetentionRule[]> {
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
    return result.documents.map((doc) => toRetentionRule(doc as Record<string, unknown>));
  }

  async findById(scope: TenantScope, id: string): Promise<RetentionRule | null> {
    try {
      const doc = await this.databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      const rule = toRetentionRule(doc as Record<string, unknown>);
      if (rule.matId !== scope.matId) return null;
      return rule;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async save(scope: TenantScope, rule: RetentionRule): Promise<RetentionRule> {
    if (rule.matId !== scope.matId) throw new Error("Retention rule is outside the authorised scope");

    const existing = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal("matId", scope.matId),
        Query.equal("name", rule.name),
        Query.limit(10),
      ]
    );
    const found = existing.documents.find((doc) => doc.$id === rule.id);

    const data = {
      matId: scope.matId,
      name: rule.name,
      recordCategory: rule.recordCategory,
      trigger: rule.trigger,
      periodMonths: rule.periodMonths,
      disposition: rule.disposition,
      authority: rule.authority,
      approvedByUserId: rule.approvedByUserId,
      effectiveAt: rule.effectiveAt,
    };

    if (found) {
      const doc = await this.databases.updateDocument(
        this.databaseId,
        this.collectionId,
        found.$id,
        data
      );
      return toRetentionRule(doc as Record<string, unknown>);
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      rule.id || ID.unique(),
      data
    );
    return toRetentionRule(doc as Record<string, unknown>);
  }
}
