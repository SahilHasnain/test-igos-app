import { ID, Query, type Databases } from "node-appwrite";
import type { AuditEvent, TenantScope } from "@/src/domain/model";
import type { AuditRepository, NewAuditEvent } from "@/src/repositories/audit-repository";
import { toAuditEvent } from "./mappers";

export class AppwriteAuditRepository implements AuditRepository {
  constructor(private readonly databases: Databases, private readonly databaseId: string, private readonly collectionId: string) {}

  async append(event: NewAuditEvent): Promise<AuditEvent> {
    const occurredAt = event.occurredAt ?? new Date().toISOString();
    const document = await this.databases.createDocument(this.databaseId, this.collectionId, ID.unique(), {
      ...event,
      academyId: event.academyId ?? null,
      matterId: event.matterId ?? null,
      previousHash: event.previousHash ?? null,
      occurredAt,
      metadata: JSON.stringify(event.metadata)
    });
    return toAuditEvent(document as Parameters<typeof toAuditEvent>[0]);
  }

  async listForMatter(scope: TenantScope, matterId: string): Promise<readonly AuditEvent[]> {
    const queries = [Query.equal("matId", scope.matId), Query.equal("matterId", matterId), Query.orderAsc("occurredAt"), Query.limit(500)];
    if (scope.academyId) queries.push(Query.equal("academyId", scope.academyId));
    const result = await this.databases.listDocuments(this.databaseId, this.collectionId, queries);
    return result.documents.map((document) => toAuditEvent(document as Parameters<typeof toAuditEvent>[0]));
  }
}
