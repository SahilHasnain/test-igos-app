import { can } from "@/src/domain/authorisation";
import type { RequestContext } from "@/src/auth/context";
import { requireContext } from "@/src/auth/context";
import type { TenantScope } from "@/src/domain/model";
import type { AssuranceAction, AuditFinding, AssuranceRisk, AuditProgramme } from "@/src/domain/assurance";
import { closeAssuranceAction, verifyAuditFinding, validateRiskAcceptance, scoreAssuranceRisk } from "@/src/domain/assurance";
import { AuditService } from "./audit-service";
import { ForbiddenError } from "./matter-service";

export interface AssuranceActionRepository {
  list(scope: TenantScope): Promise<readonly AssuranceAction[]>;
  findById(scope: TenantScope, id: string): Promise<AssuranceAction | null>;
  save(scope: TenantScope, action: AssuranceAction): Promise<AssuranceAction>;
}

export interface AuditProgrammeRepository {
  list(scope: TenantScope): Promise<readonly AuditProgramme[]>;
  findById(scope: TenantScope, id: string): Promise<AuditProgramme | null>;
  save(scope: TenantScope, programme: AuditProgramme): Promise<AuditProgramme>;
}

export interface AuditFindingRepository {
  list(scope: TenantScope): Promise<readonly AuditFinding[]>;
  findById(scope: TenantScope, id: string): Promise<AuditFinding | null>;
  save(scope: TenantScope, finding: AuditFinding): Promise<AuditFinding>;
}

export interface AssuranceRiskRepository {
  list(scope: TenantScope): Promise<readonly AssuranceRisk[]>;
  findById(scope: TenantScope, id: string): Promise<AssuranceRisk | null>;
  save(scope: TenantScope, risk: AssuranceRisk): Promise<AssuranceRisk>;
}

function assertAllowed(context: RequestContext, scope: TenantScope, capability: Parameters<typeof can>[2]) {
  if (!can(context.membership, scope, capability)) throw new ForbiddenError();
}

export class AssuranceActionService {
  constructor(private readonly repository: AssuranceActionRepository, private readonly audit: AuditService) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly AssuranceAction[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, action: AssuranceAction): Promise<AssuranceAction> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.repository.save(scope, action);
    await this.audit.record(context, scope, "assurance.action.saved", { actionId: action.id, title: action.title, status: action.status });
    return saved;
  }

  async complete(raw: RequestContext, scope: TenantScope, id: string, actorUserId: string, rationale: string): Promise<AssuranceAction> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const action = await this.repository.findById(scope, id);
    if (!action) throw new Error("Assurance action not found");
    const completed = closeAssuranceAction(action, actorUserId, rationale);
    const saved = await this.repository.save(scope, completed);
    await this.audit.record(context, scope, "assurance.action.completed", { actionId: id, rationale }, id);
    return saved;
  }
}

export class AuditProgrammeService {
  constructor(private readonly repository: AuditProgrammeRepository, private readonly audit: AuditService) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly AuditProgramme[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, programme: AuditProgramme): Promise<AuditProgramme> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.repository.save(scope, programme);
    await this.audit.record(context, scope, "audit.programme.saved", { programmeId: programme.id, title: programme.title, status: programme.status });
    return saved;
  }
}

export class AuditFindingService {
  constructor(private readonly repository: AuditFindingRepository, private readonly audit: AuditService) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly AuditFinding[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, finding: AuditFinding): Promise<AuditFinding> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.repository.save(scope, finding);
    await this.audit.record(context, scope, "audit.finding.saved", { findingId: finding.id, title: finding.title, status: finding.status });
    return saved;
  }

  async verify(raw: RequestContext, scope: TenantScope, id: string, verifierUserId: string): Promise<AuditFinding> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const finding = await this.repository.findById(scope, id);
    if (!finding) throw new Error("Audit finding not found");
    const verified = verifyAuditFinding(finding, verifierUserId);
    const saved = await this.repository.save(scope, verified);
    await this.audit.record(context, scope, "audit.finding.verified", { findingId: id }, id);
    return saved;
  }
}

export class AssuranceRiskService {
  constructor(private readonly repository: AssuranceRiskRepository, private readonly audit: AuditService) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly AssuranceRisk[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, risk: AssuranceRisk): Promise<AssuranceRisk> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const scored = scoreAssuranceRisk(risk);
    const saved = await this.repository.save(scope, risk);
    await this.audit.record(context, scope, "assurance.risk.saved", { riskId: risk.id, title: risk.title, rating: scored.rating });
    return saved;
  }

  async accept(raw: RequestContext, scope: TenantScope, id: string, acceptedByUserId: string, rationale: string): Promise<AssuranceRisk> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const risk = await this.repository.findById(scope, id);
    if (!risk) throw new Error("Assurance risk not found");
    const updated = { ...risk, acceptedByUserId, acceptanceRationale: rationale };
    validateRiskAcceptance(updated);
    const saved = await this.repository.save(scope, updated);
    await this.audit.record(context, scope, "assurance.risk.accepted", { riskId: id, rationale }, id);
    return saved;
  }
}
