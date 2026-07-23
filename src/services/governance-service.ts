import { can } from "@/src/domain/authorisation";
import { assertDpiaReadyForApproval, type DpiaRisk, type DpiaSection } from "@/src/domain/dpia";
import { transitionPolicy, validatePolicyException, type PolicyAcknowledgement, type PolicyException, type PolicyRecord, type PolicyStatus } from "@/src/domain/policy";
import { processingActivitySchema, type ProcessingActivity } from "@/src/domain/ropa";
import type { TenantScope } from "@/src/domain/model";
import type { RequestContext } from "@/src/auth/context";
import { requireContext } from "@/src/auth/context";
import type { DpiaRepository, PolicyRepository, RopaRepository } from "@/src/repositories/governance-repository";
import { AuditService } from "./audit-service";
import { ForbiddenError } from "./matter-service";

function allowed(context: RequestContext, scope: TenantScope, capability: Parameters<typeof can>[2]) {
  if (!can(context.membership, scope, capability)) throw new ForbiddenError();
}

export class DpiaGovernanceService {
  constructor(private readonly repository: DpiaRepository, private readonly audit: AuditService) {}

  async saveSection(raw: RequestContext, scope: TenantScope, matterId: string, section: DpiaSection) {
    const context = requireContext(raw); allowed(context, scope, "matter:update");
    const existing = (await this.repository.listSections(scope, matterId)).find((item) => item.id === section.id);
    if (existing?.assignedUserId && existing.assignedUserId !== context.user.id && !context.membership.roles.some((role) => role === "dpo" || role === "mat-admin")) throw new ForbiddenError();
    const saved = await this.repository.saveSection(scope, matterId, section);
    await this.audit.record(context, scope, "dpia.section.saved", { sectionId: section.id, status: section.status, assignedRole: section.assignedRole }, matterId);
    return saved;
  }

  async saveRisk(raw: RequestContext, scope: TenantScope, matterId: string, risk: DpiaRisk) {
    const context = requireContext(raw); allowed(context, scope, "matter:update");
    const saved = await this.repository.saveRisk(scope, matterId, risk);
    await this.audit.record(context, scope, "dpia.risk.saved", { riskId: risk.id, likelihood: risk.likelihood, impact: risk.impact, controlEffectiveness: risk.controlEffectiveness }, matterId);
    return saved;
  }

  async approve(raw: RequestContext, scope: TenantScope, matterId: string) {
    const context = requireContext(raw); allowed(context, scope, "matter:approve");
    const sections = await this.repository.listSections(scope, matterId);
    const risks = await this.repository.listRisks(scope, matterId);
    assertDpiaReadyForApproval(sections, risks);
    await this.audit.record(context, scope, "dpia.approved", { sectionCount: sections.length, riskCount: risks.length }, matterId);
    return { approved: true as const, approvedByUserId: context.user.id };
  }
}

export class RopaGovernanceService {
  constructor(private readonly repository: RopaRepository, private readonly audit: AuditService) {}
  async list(raw: RequestContext, scope: TenantScope) { const context = requireContext(raw); allowed(context, scope, "report:read"); return this.repository.list(scope); }
  async save(raw: RequestContext, scope: TenantScope, input: unknown) {
    const context = requireContext(raw); allowed(context, scope, "matter:update");
    const activity = processingActivitySchema.parse(input);
    const saved = await this.repository.save(scope, activity);
    await this.audit.record(context, scope, "ropa.activity.saved", { activityId: activity.id, status: activity.status, name: activity.name });
    return saved;
  }
}

export class PolicyGovernanceService {
  constructor(private readonly repository: PolicyRepository, private readonly audit: AuditService) {}
  async list(raw: RequestContext, scope: TenantScope) { const context = requireContext(raw); allowed(context, scope, "report:read"); return this.repository.list(scope); }
  async transition(raw: RequestContext, scope: TenantScope, policyId: string, to: PolicyStatus) {
    const context = requireContext(raw); allowed(context, scope, to === "approved" || to === "published" ? "matter:approve" : "matter:update");
    const current = await this.repository.findById(scope, policyId); if (!current) throw new Error("Policy not found");
    const saved = await this.repository.save(scope, transitionPolicy(current, to, context.user.id));
    await this.audit.record(context, scope, "policy.transitioned", { policyId, from: current.status, to });
    return saved;
  }
  async assignAcknowledgement(raw: RequestContext, scope: TenantScope, record: PolicyAcknowledgement) {
    const context = requireContext(raw); allowed(context, scope, "matter:update");
    const saved = await this.repository.saveAcknowledgement(scope, record);
    await this.audit.record(context, scope, "policy.acknowledgement.assigned", { policyId: record.policyId, userId: record.userId, dueAt: record.dueAt });
    return saved;
  }
  async saveException(raw: RequestContext, scope: TenantScope, exception: PolicyException) {
    const context = requireContext(raw); allowed(context, scope, exception.approvedByUserId ? "matter:approve" : "matter:update");
    validatePolicyException(exception);
    const saved = await this.repository.saveException(scope, exception);
    await this.audit.record(context, scope, "policy.exception.saved", { policyId: exception.policyId, exceptionId: exception.id, expiresAt: exception.expiresAt });
    return saved;
  }
  async save(raw: RequestContext, scope: TenantScope, policy: PolicyRecord) {
    const context = requireContext(raw); allowed(context, scope, "matter:update");
    return this.repository.save(scope, policy);
  }
}
