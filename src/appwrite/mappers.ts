import type { Models } from "node-appwrite";
import type { AuditEvent, Matter } from "@/src/domain/model";

type MatterDocument = Models.Document & Omit<Matter, "id"|"createdAt"|"updatedAt">;
type AuditDocument = Models.Document & Omit<AuditEvent, "id"|"occurredAt"> & { occurredAt: string };

export function toMatter(document: MatterDocument): Matter {
  return {
    id: document.$id,
    reference: document.reference,
    type: document.type,
    status: document.status,
    title: document.title,
    ownerUserId: document.ownerUserId,
    matId: document.matId,
    academyId: document.academyId || undefined,
    statutoryDueAt: document.statutoryDueAt || undefined,
    version: document.version,
    createdAt: document.$createdAt,
    updatedAt: document.$updatedAt
  };
}

export function toAuditEvent(document: AuditDocument): AuditEvent {
  return {
    id: document.$id,
    matId: document.matId,
    academyId: document.academyId || undefined,
    matterId: document.matterId || undefined,
    actorUserId: document.actorUserId,
    action: document.action,
    occurredAt: document.occurredAt,
    correlationId: document.correlationId,
    previousHash: document.previousHash || undefined,
    payloadHash: document.payloadHash,
    metadata: typeof document.metadata === "string" ? JSON.parse(document.metadata) : document.metadata
  };
}
