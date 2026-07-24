import type { AiSystemRecord, InformationAsset, RetentionRule, RecordInstance, RecordsHold, ContractGovernanceRecord } from "@/src/domain/advanced-governance";
import type { TenantScope } from "@/src/domain/model";
import type { AiSystemRepository, InformationAssetRepository, RetentionRuleRepository, RecordInstanceRepository, RecordsHoldRepository, ContractGovernanceRepository } from "@/src/services/advanced-governance-service";

type Scoped<T> = { matId: string; academyId?: string; value: T };

const state = {
  aiSystems: [] as Scoped<AiSystemRecord>[],
  assets: [] as Scoped<InformationAsset>[],
  retentionRules: [] as { matId: string; value: RetentionRule }[],
  recordInstances: [] as Scoped<RecordInstance>[],
  holds: [] as Scoped<RecordsHold>[],
  contracts: [] as { matId: string; value: ContractGovernanceRecord }[],
};

const scoped = <T extends Scoped<unknown>>(scope: TenantScope, item: T) => item.matId === scope.matId && (!scope.academyId || item.academyId === scope.academyId);
const matScoped = <T extends { matId: string }>(scope: TenantScope, item: T) => item.matId === scope.matId;

export class DemoAiSystemRepository implements AiSystemRepository {
  async list(scope: TenantScope) { return state.aiSystems.filter((item) => item.matId === scope.matId).map((item) => item.value); }
  async findById(scope: TenantScope, id: string) { return state.aiSystems.find((item) => item.value.id === id && item.matId === scope.matId)?.value ?? null; }
  async save(scope: TenantScope, system: AiSystemRecord) {
    const index = state.aiSystems.findIndex((item) => item.value.id === system.id && item.matId === scope.matId);
    const record = { matId: scope.matId, value: system };
    if (index >= 0) state.aiSystems[index] = record; else state.aiSystems.push(record);
    return system;
  }
}

export class DemoInformationAssetRepository implements InformationAssetRepository {
  async list(scope: TenantScope) { return state.assets.filter((item) => scoped(scope, item)).map((item) => item.value); }
  async findById(scope: TenantScope, id: string) { return state.assets.find((item) => item.value.id === id && scoped(scope, item))?.value ?? null; }
  async save(scope: TenantScope, asset: InformationAsset) {
    const index = state.assets.findIndex((item) => item.value.id === asset.id && scoped(scope, item));
    const record = { matId: scope.matId, academyId: scope.academyId, value: asset };
    if (index >= 0) state.assets[index] = record; else state.assets.push(record);
    return asset;
  }
}

export class DemoRetentionRuleRepository implements RetentionRuleRepository {
  async list(scope: TenantScope) { return state.retentionRules.filter((item) => matScoped(scope, item)).map((item) => item.value); }
  async findById(scope: TenantScope, id: string) { return state.retentionRules.find((item) => item.value.id === id && matScoped(scope, item))?.value ?? null; }
  async save(scope: TenantScope, rule: RetentionRule) {
    const index = state.retentionRules.findIndex((item) => item.value.id === rule.id && matScoped(scope, item));
    const record = { matId: scope.matId, value: rule };
    if (index >= 0) state.retentionRules[index] = record; else state.retentionRules.push(record);
    return rule;
  }
}

export class DemoRecordInstanceRepository implements RecordInstanceRepository {
  async list(scope: TenantScope) { return state.recordInstances.filter((item) => scoped(scope, item)).map((item) => item.value); }
  async listByAsset(scope: TenantScope, assetId: string) { return state.recordInstances.filter((item) => scoped(scope, item) && item.value.assetId === assetId).map((item) => item.value); }
  async findById(scope: TenantScope, id: string) { return state.recordInstances.find((item) => item.value.id === id && scoped(scope, item))?.value ?? null; }
  async save(scope: TenantScope, record: RecordInstance) {
    const index = state.recordInstances.findIndex((item) => item.value.id === record.id && scoped(scope, item));
    const recordScoped = { matId: scope.matId, academyId: scope.academyId, value: record };
    if (index >= 0) state.recordInstances[index] = recordScoped; else state.recordInstances.push(recordScoped);
    return record;
  }
}

export class DemoRecordsHoldRepository implements RecordsHoldRepository {
  async list(scope: TenantScope) { return state.holds.filter((item) => scoped(scope, item)).map((item) => item.value); }
  async listActive(scope: TenantScope) { return this.list(scope).then((holds) => holds.filter((h) => !h.releasedAt)); }
  async findById(scope: TenantScope, id: string) { return state.holds.find((item) => item.value.id === id && scoped(scope, item))?.value ?? null; }
  async save(scope: TenantScope, hold: RecordsHold) {
    const index = state.holds.findIndex((item) => item.value.id === hold.id && scoped(scope, item));
    const record = { matId: scope.matId, academyId: scope.academyId, value: hold };
    if (index >= 0) state.holds[index] = record; else state.holds.push(record);
    return hold;
  }
}

export class DemoContractGovernanceRepository implements ContractGovernanceRepository {
  async list(scope: TenantScope) { return state.contracts.filter((item) => matScoped(scope, item)).map((item) => item.value); }
  async findById(scope: TenantScope, id: string) { return state.contracts.find((item) => item.value.id === id && matScoped(scope, item))?.value ?? null; }
  async save(scope: TenantScope, contract: ContractGovernanceRecord) {
    const index = state.contracts.findIndex((item) => item.value.id === contract.id && matScoped(scope, item));
    const record = { matId: scope.matId, value: contract };
    if (index >= 0) state.contracts[index] = record; else state.contracts.push(record);
    return contract;
  }
}

export function resetAdvancedGovernanceDemoState() {
  state.aiSystems.length = 0; state.assets.length = 0;
  state.retentionRules.length = 0; state.recordInstances.length = 0;
  state.holds.length = 0; state.contracts.length = 0;
}
