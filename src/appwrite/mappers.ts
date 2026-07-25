import type { Models } from "node-appwrite";
import type { AuditEvent, Matter } from "@/src/domain/model";

type MatterDocument = Models.Document & Omit<Matter, "id"|"createdAt"|"updatedAt">;
type AuditDocument = Models.Document & Omit<AuditEvent, "id"|"occurredAt"> & { occurredAt: string };

/** Parse the `extendedFields` JSON column from an Appwrite document. */
export function parseOverflow(document: Record<string, unknown>): Record<string, string> {
  const raw = document.extendedFields;
  if (typeof raw !== "string" || !raw) return {};
  try { return JSON.parse(raw) as Record<string, string>; } catch { return {}; }
}

/**
 * Move overflow fields from `data` into an `extendedFields` JSON string.
 * Mutates `data` in place — removes overflow keys and adds `extendedFields`.
 */
export function packOverflow(data: Record<string, unknown>, keys: readonly string[]): void {
  const overflow: Record<string, string> = {};
  for (const key of keys) {
    if (data[key] !== undefined) {
      overflow[key] = data[key] as string;
      delete data[key];
    }
  }
  if (Object.keys(overflow).length > 0) {
    data.extendedFields = JSON.stringify(overflow);
  }
}

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
