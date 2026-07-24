import { ID, Query, type Databases } from "node-appwrite";
import type { TenantScope } from "@/src/domain/model";

export interface SecondReview {
  id: string;
  matId: string;
  academyId?: string;
  matterId: string;
  suggestionId: string;
  reviewerUserId: string;
  decision: string;
  rationale: string;
  reviewedAt: string;
}

export interface SecondReviewRepository {
  listBySuggestion(scope: TenantScope, suggestionId: string): Promise<readonly SecondReview[]>;
  save(scope: TenantScope, review: SecondReview): Promise<SecondReview>;
}

function toSecondReview(document: Record<string, unknown>): SecondReview {
  return {
    id: document.$id as string,
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    matterId: document.matterId as string,
    suggestionId: document.suggestionId as string,
    reviewerUserId: document.reviewerUserId as string,
    decision: document.decision as string,
    rationale: document.rationale as string,
    reviewedAt: document.reviewedAt as string,
  };
}

export class AppwriteSecondReviewRepository implements SecondReviewRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async listBySuggestion(scope: TenantScope, suggestionId: string): Promise<readonly SecondReview[]> {
    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("suggestionId", suggestionId),
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
    return result.documents.map((doc) => toSecondReview(doc as Record<string, unknown>));
  }

  async save(scope: TenantScope, review: SecondReview): Promise<SecondReview> {
    if (review.matId !== scope.matId) throw new Error("Second review is outside the authorised scope");
    if (scope.academyId && review.academyId !== scope.academyId) {
      throw new Error("Second review is outside the authorised scope");
    }

    const doc = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      review.id || ID.unique(),
      {
        matId: scope.matId,
        academyId: scope.academyId ?? null,
        matterId: review.matterId,
        suggestionId: review.suggestionId,
        reviewerUserId: review.reviewerUserId,
        decision: review.decision,
        rationale: review.rationale,
        reviewedAt: review.reviewedAt,
      }
    );
    return toSecondReview(doc as Record<string, unknown>);
  }
}
