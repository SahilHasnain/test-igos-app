import { randomUUID } from "node:crypto";
import { can } from "@/src/domain/authorisation";
import type { Matter, TenantScope } from "@/src/domain/model";
import type { RequestContext } from "@/src/auth/context";
import { requireContext } from "@/src/auth/context";
import type { CreateMatterInput, MatterQuery, MatterRepository } from "@/src/repositories/matter-repository";
import { AuditService } from "./audit-service";

export class ForbiddenError extends Error {
  constructor() { super("You do not have permission to perform this action"); this.name = "ForbiddenError"; }
}
export class MatterNotFoundError extends Error {
  constructor() { super("Matter not found"); this.name = "MatterNotFoundError"; }
}

function assertAllowed(context: RequestContext, scope: TenantScope, capability: Parameters<typeof can>[2]) {
  if (!can(context.membership, scope, capability)) throw new ForbiddenError();
}

export class MatterService {
  constructor(private readonly matters: MatterRepository, private readonly audit: AuditService) {}

  async create(rawContext: RequestContext, input: CreateMatterInput): Promise<Matter> {
    const context = requireContext(rawContext);
    assertAllowed(context, input, "matter:create");
    const matter = await this.matters.create(input);
    await this.audit.record(context, input, "matter.created", { id: matter.id, reference: matter.reference, type: matter.type }, matter.id);
    return matter;
  }

  async get(rawContext: RequestContext, scope: TenantScope, id: string): Promise<Matter> {
    const context = requireContext(rawContext);
    assertAllowed(context, scope, "matter:read");
    const matter = await this.matters.findById(scope, id);
    if (!matter) throw new MatterNotFoundError();
    return matter;
  }

  async list(rawContext: RequestContext, query: MatterQuery): Promise<readonly Matter[]> {
    const context = requireContext(rawContext);
    assertAllowed(context, query, "matter:read");
    return this.matters.list(query);
  }

  async update(rawContext: RequestContext, scope: TenantScope, id: string, expectedVersion: number, patch: Parameters<MatterRepository["update"]>[3]): Promise<Matter> {
    const context = requireContext(rawContext);
    assertAllowed(context, scope, "matter:update");
    const matter = await this.matters.update(scope, id, expectedVersion, patch);
    await this.audit.record(context, scope, "matter.updated", { id, expectedVersion, patch, eventId: randomUUID() }, id);
    return matter;
  }
}
