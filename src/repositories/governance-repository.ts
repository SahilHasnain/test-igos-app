import type { DpiaRisk, DpiaSection } from "@/src/domain/dpia";
import type { PolicyAcknowledgement, PolicyException, PolicyRecord } from "@/src/domain/policy";
import type { ProcessingActivity } from "@/src/domain/ropa";
import type { TenantScope } from "@/src/domain/model";

export interface DpiaRepository {
  listSections(scope: TenantScope, matterId: string): Promise<readonly DpiaSection[]>;
  saveSection(scope: TenantScope, matterId: string, section: DpiaSection): Promise<DpiaSection>;
  listRisks(scope: TenantScope, matterId: string): Promise<readonly DpiaRisk[]>;
  saveRisk(scope: TenantScope, matterId: string, risk: DpiaRisk): Promise<DpiaRisk>;
}

export interface RopaRepository {
  list(scope: TenantScope): Promise<readonly ProcessingActivity[]>;
  findById(scope: TenantScope, id: string): Promise<ProcessingActivity | null>;
  save(scope: TenantScope, activity: ProcessingActivity): Promise<ProcessingActivity>;
}

export interface PolicyRepository {
  list(scope: TenantScope): Promise<readonly PolicyRecord[]>;
  findById(scope: TenantScope, id: string): Promise<PolicyRecord | null>;
  save(scope: TenantScope, policy: PolicyRecord): Promise<PolicyRecord>;
  listAcknowledgements(scope: TenantScope, policyId: string): Promise<readonly PolicyAcknowledgement[]>;
  saveAcknowledgement(scope: TenantScope, acknowledgement: PolicyAcknowledgement): Promise<PolicyAcknowledgement>;
  saveException(scope: TenantScope, exception: PolicyException): Promise<PolicyException>;
}
