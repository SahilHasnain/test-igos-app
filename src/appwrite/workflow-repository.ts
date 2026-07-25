import { ID, Query, type Databases } from "node-appwrite";
import type { CaseWorkflow, WorkflowStage } from "@/src/domain/workflow";
import type { TenantScope } from "@/src/domain/model";
import type { WorkflowRepository } from "@/src/repositories/workflow-repository";

function toWorkflow(document: Record<string, unknown>): CaseWorkflow {
  return {
    matId: document.matId as string,
    academyId: (document.academyId as string) || undefined,
    matterId: document.matterId as string,
    type: document.type as CaseWorkflow["type"],
    stage: document.stage as WorkflowStage,
    assignedUserId: document.assignedUserId as string,
    dueAt: (document.dueAt as string) || undefined,
    completedStages: (document.completedStages as string[]) || [],
    updatedAt: document.$updatedAt as string,
    version: document.version as number,
  };
}

export class AppwriteWorkflowRepository implements WorkflowRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async create(workflow: CaseWorkflow): Promise<CaseWorkflow> {
    const document = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      ID.unique(),
      {
        matId: workflow.matId,
        academyId: workflow.academyId ?? null,
        matterId: workflow.matterId,
        type: workflow.type,
        stage: workflow.stage,
        assignedUserId: workflow.assignedUserId,
        dueAt: workflow.dueAt ?? null,
        completedStages: workflow.completedStages,
        version: 1,
      }
    );
    return toWorkflow(document as Record<string, unknown>);
  }

  async findByMatterId(scope: TenantScope, matterId: string): Promise<CaseWorkflow | null> {
    try {
      const queries = [
        Query.equal("matId", scope.matId),
        Query.equal("matterId", matterId),
        Query.limit(1),
      ];
      if (scope.academyId) {
        queries.push(Query.equal("academyId", scope.academyId));
      }
      const result = await this.databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );
      if (result.documents.length === 0) return null;
      return toWorkflow(result.documents[0] as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async transition(
    scope: TenantScope,
    matterId: string,
    expectedVersion: number,
    to: WorkflowStage,
    completedStages: readonly string[],
    assignedUserId?: string
  ): Promise<CaseWorkflow> {
    const current = await this.findByMatterId(scope, matterId);
    if (!current) throw new Error("Workflow not found");
    if (current.version !== expectedVersion) throw new Error("Version conflict");

    const queries = [
      Query.equal("matId", scope.matId),
      Query.equal("matterId", matterId),
      Query.limit(1),
    ];
    if (scope.academyId) {
      queries.push(Query.equal("academyId", scope.academyId));
    }
    const result = await this.databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );
    if (result.documents.length === 0) throw new Error("Workflow document not found");
    const documentId = result.documents[0].$id;

    const updates: Record<string, unknown> = {
      stage: to,
      completedStages: completedStages as string[],
      version: expectedVersion + 1,
    };
    if (assignedUserId !== undefined) {
      updates.assignedUserId = assignedUserId;
    }

    const document = await this.databases.updateDocument(
      this.databaseId,
      this.collectionId,
      documentId,
      updates
    );
    return toWorkflow(document as Record<string, unknown>);
  }
}
