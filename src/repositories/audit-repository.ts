import type { AuditEvent, TenantScope } from "@/src/domain/model";

export type NewAuditEvent = Omit<AuditEvent, "id" | "occurredAt"> & { occurredAt?: string };

export interface AuditRepository {
  append(event: NewAuditEvent): Promise<AuditEvent>;
  listForMatter(scope: TenantScope, matterId: string): Promise<readonly AuditEvent[]>;
}
