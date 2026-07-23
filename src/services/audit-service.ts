import { createHash } from "node:crypto";
import type { RequestContext } from "@/src/auth/context";
import type { AuditRepository } from "@/src/repositories/audit-repository";
import type { TenantScope } from "@/src/domain/model";

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  return "{" + Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => JSON.stringify(k)+":"+canonical(v)).join(",") + "}";
}

export const payloadHash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async record(context: RequestContext, scope: TenantScope, action: string, payload: unknown, matterId?: string) {
    const previous = matterId ? await this.repository.listForMatter(scope, matterId) : [];
    return this.repository.append({
      ...scope,
      matterId,
      actorUserId: context.user.id,
      action,
      correlationId: context.correlationId,
      previousHash: previous.at(-1)?.payloadHash,
      payloadHash: payloadHash(payload),
      metadata: {}
    });
  }
}
