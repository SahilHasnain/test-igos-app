import { can } from "@/src/domain/authorisation";
import type { RequestContext } from "@/src/auth/context";
import { requireContext } from "@/src/auth/context";
import type { TenantScope } from "@/src/domain/model";
import type { AiSystemRecord, InformationAsset, RetentionRule, RecordInstance, RecordsHold, ContractGovernanceRecord } from "@/src/domain/advanced-governance";
import { validateAiSystemApproval, validateInformationAsset, disposalEligibility, assertContractApproval, assertSupplierOffboarding } from "@/src/domain/advanced-governance";
import { AuditService } from "./audit-service";
import { ForbiddenError } from "./matter-service";

export interface AiSystemRepository {
  list(scope: TenantScope): Promise<readonly AiSystemRecord[]>;
  findById(scope: TenantScope, id: string): Promise<AiSystemRecord | null>;
  save(scope: TenantScope, system: AiSystemRecord): Promise<AiSystemRecord>;
}

export interface InformationAssetRepository {
  list(scope: TenantScope): Promise<readonly InformationAsset[]>;
  findById(scope: TenantScope, id: string): Promise<InformationAsset | null>;
  save(scope: TenantScope, asset: InformationAsset): Promise<InformationAsset>;
}

export interface RetentionRuleRepository {
  list(scope: TenantScope): Promise<readonly RetentionRule[]>;
  findById(scope: TenantScope, id: string): Promise<RetentionRule | null>;
  save(scope: TenantScope, rule: RetentionRule): Promise<RetentionRule>;
}

export interface RecordInstanceRepository {
  list(scope: TenantScope): Promise<readonly RecordInstance[]>;
  listByAsset(scope: TenantScope, assetId: string): Promise<readonly RecordInstance[]>;
  findById(scope: TenantScope, id: string): Promise<RecordInstance | null>;
  save(scope: TenantScope, record: RecordInstance): Promise<RecordInstance>;
}

export interface RecordsHoldRepository {
  list(scope: TenantScope): Promise<readonly RecordsHold[]>;
  listActive(scope: TenantScope): Promise<readonly RecordsHold[]>;
  findById(scope: TenantScope, id: string): Promise<RecordsHold | null>;
  save(scope: TenantScope, hold: RecordsHold): Promise<RecordsHold>;
}

export interface ContractGovernanceRepository {
  list(scope: TenantScope): Promise<readonly ContractGovernanceRecord[]>;
  findById(scope: TenantScope, id: string): Promise<ContractGovernanceRecord | null>;
  save(scope: TenantScope, contract: ContractGovernanceRecord): Promise<ContractGovernanceRecord>;
}

function assertAllowed(context: RequestContext, scope: TenantScope, capability: Parameters<typeof can>[2]) {
  if (!can(context.membership, scope, capability)) throw new ForbiddenError();
}

export class AiSystemService {
  constructor(private readonly repository: AiSystemRepository, private readonly audit: AuditService) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly AiSystemRecord[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, system: AiSystemRecord): Promise<AiSystemRecord> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.repository.save(scope, system);
    await this.audit.record(context, scope, "ai.system.saved", { systemId: system.id, name: system.name, status: system.status });
    return saved;
  }

  async approve(raw: RequestContext, scope: TenantScope, id: string, approvedByUserId: string, rationale: string): Promise<AiSystemRecord> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:approve");
    const system = await this.repository.findById(scope, id);
    if (!system) throw new Error("AI system not found");
    const updated = { ...system, status: "approved-production" as const, approvedByUserId, approvalRationale: rationale };
    validateAiSystemApproval(updated);
    const saved = await this.repository.save(scope, updated);
    await this.audit.record(context, scope, "ai.system.approved", { systemId: id, rationale }, id);
    return saved;
  }
}

export class InformationAssetService {
  constructor(private readonly repository: InformationAssetRepository, private readonly audit: AuditService) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly InformationAsset[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, asset: InformationAsset): Promise<InformationAsset> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    validateInformationAsset(asset);
    const saved = await this.repository.save(scope, asset);
    await this.audit.record(context, scope, "information.asset.saved", { assetId: asset.id, name: asset.name, classification: asset.classification });
    return saved;
  }
}

export class RetentionRuleService {
  constructor(private readonly repository: RetentionRuleRepository, private readonly audit: AuditService) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly RetentionRule[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, rule: RetentionRule): Promise<RetentionRule> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.repository.save(scope, rule);
    await this.audit.record(context, scope, "retention.rule.saved", { ruleId: rule.id, name: rule.name });
    return saved;
  }
}

export class RecordInstanceService {
  constructor(
    private readonly recordRepository: RecordInstanceRepository,
    private readonly holdRepository: RecordsHoldRepository,
    private readonly audit: AuditService
  ) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly RecordInstance[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.recordRepository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, record: RecordInstance): Promise<RecordInstance> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.recordRepository.save(scope, record);
    await this.audit.record(context, scope, "record.instance.saved", { recordId: record.id, assetId: record.assetId, status: record.status });
    return saved;
  }

  async checkDisposal(raw: RequestContext, scope: TenantScope, id: string): Promise<{ eligible: boolean; reason: string; holdIds: readonly string[] }> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    const record = await this.recordRepository.findById(scope, id);
    if (!record) throw new Error("Record instance not found");
    const holds = await this.holdRepository.listActive(scope);
    return disposalEligibility(record, holds);
  }
}

export class RecordsHoldService {
  constructor(private readonly repository: RecordsHoldRepository, private readonly audit: AuditService) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly RecordsHold[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, hold: RecordsHold): Promise<RecordsHold> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.repository.save(scope, hold);
    await this.audit.record(context, scope, "records.hold.saved", { holdId: hold.id, name: hold.name, reason: hold.reason });
    return saved;
  }

  async release(raw: RequestContext, scope: TenantScope, id: string, releasedByUserId: string, releaseRationale: string): Promise<RecordsHold> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const hold = await this.repository.findById(scope, id);
    if (!hold) throw new Error("Records hold not found");
    const updated = { ...hold, releasedByUserId, releasedAt: new Date().toISOString(), releaseRationale };
    const saved = await this.repository.save(scope, updated);
    await this.audit.record(context, scope, "records.hold.released", { holdId: id, rationale: releaseRationale }, id);
    return saved;
  }
}

export class ContractGovernanceService {
  constructor(private readonly repository: ContractGovernanceRepository, private readonly audit: AuditService) {}

  async list(raw: RequestContext, scope: TenantScope): Promise<readonly ContractGovernanceRecord[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.list(scope);
  }

  async save(raw: RequestContext, scope: TenantScope, contract: ContractGovernanceRecord): Promise<ContractGovernanceRecord> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.repository.save(scope, contract);
    await this.audit.record(context, scope, "contract.governance.saved", { contractId: contract.id, title: contract.title, status: contract.status });
    return saved;
  }

  async approve(raw: RequestContext, scope: TenantScope, id: string): Promise<ContractGovernanceRecord> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:approve");
    const contract = await this.repository.findById(scope, id);
    if (!contract) throw new Error("Contract not found");
    assertContractApproval(contract);
    const updated = { ...contract, status: "approved" as const };
    const saved = await this.repository.save(scope, updated);
    await this.audit.record(context, scope, "contract.governance.approved", { contractId: id }, id);
    return saved;
  }

  async offboard(raw: RequestContext, scope: TenantScope, id: string, documentId: string): Promise<ContractGovernanceRecord> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const contract = await this.repository.findById(scope, id);
    if (!contract) throw new Error("Contract not found");
    const updated = { ...contract, offboardingCompletedAt: new Date().toISOString(), deletionEvidenceDocumentId: documentId, status: "terminated" as const };
    assertSupplierOffboarding(updated);
    const saved = await this.repository.save(scope, updated);
    await this.audit.record(context, scope, "contract.governance.offboarded", { contractId: id }, id);
    return saved;
  }
}
