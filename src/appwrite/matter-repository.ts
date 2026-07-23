import { ID, Query, type Databases } from "node-appwrite";
import type { Matter, TenantScope } from "@/src/domain/model";
import type { CreateMatterInput, MatterQuery, MatterRepository } from "@/src/repositories/matter-repository";
import { toMatter } from "./mappers";

export class VersionConflictError extends Error {
  constructor() { super("The matter was changed by another user"); this.name = "VersionConflictError"; }
}

export class AppwriteMatterRepository implements MatterRepository {
  constructor(
    private readonly databases: Databases,
    private readonly databaseId: string,
    private readonly collectionId: string
  ) {}

  async create(input: CreateMatterInput): Promise<Matter> {
    const document = await this.databases.createDocument(
      this.databaseId,
      this.collectionId,
      ID.unique(),
      { ...input, academyId: input.academyId ?? null, statutoryDueAt: input.statutoryDueAt ?? null, status: "open", version: 1 }
    );
    return toMatter(document as Parameters<typeof toMatter>[0]);
  }

  async findById(scope: TenantScope, id: string): Promise<Matter | null> {
    try {
      const document = await this.databases.getDocument(this.databaseId, this.collectionId, id);
      const matter = toMatter(document as Parameters<typeof toMatter>[0]);
      if (matter.matId !== scope.matId || (scope.academyId && matter.academyId !== scope.academyId)) return null;
      return matter;
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === 404) return null;
      throw error;
    }
  }

  async list(query: MatterQuery): Promise<readonly Matter[]> {
    const filters = [Query.equal("matId", query.matId), Query.orderDesc("$createdAt"), Query.limit(100)];
    if (query.academyId) filters.push(Query.equal("academyId", query.academyId));
    if (query.type) filters.push(Query.equal("type", query.type));
    if (query.status) filters.push(Query.equal("status", query.status));
    if (query.ownerUserId) filters.push(Query.equal("ownerUserId", query.ownerUserId));
    const result = await this.databases.listDocuments(this.databaseId, this.collectionId, filters);
    return result.documents.map((document) => toMatter(document as Parameters<typeof toMatter>[0]));
  }

  async update(scope: TenantScope, id: string, expectedVersion: number, patch: Parameters<MatterRepository["update"]>[3]): Promise<Matter> {
    const current = await this.findById(scope, id);
    if (!current) throw new Error("Matter not found");
    if (current.version !== expectedVersion) throw new VersionConflictError();
    const document = await this.databases.updateDocument(this.databaseId, this.collectionId, id, { ...patch, version: expectedVersion + 1 });
    return toMatter(document as Parameters<typeof toMatter>[0]);
  }
}
