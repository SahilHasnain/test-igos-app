import { randomUUID } from "node:crypto";
import type { AssuranceAction, AuditProgramme, AuditFinding, AssuranceRisk } from "@/src/domain/assurance";
import type { TenantScope } from "@/src/domain/model";
import type { AssuranceActionRepository, AuditProgrammeRepository, AuditFindingRepository, AssuranceRiskRepository } from "@/src/services/assurance-service";

type Scoped<T> = { matId: string; academyId?: string; value: T };

const state = {
  actions: [] as Scoped<AssuranceAction>[],
  programmes: [] as Scoped<AuditProgramme>[],
  findings: [] as Scoped<AuditFinding>[],
  risks: [] as Scoped<AssuranceRisk>[],
};

const scoped = <T extends Scoped<unknown>>(scope: TenantScope, item: T) => item.matId === scope.matId && (!scope.academyId || item.academyId === scope.academyId);

export class DemoAssuranceActionRepository implements AssuranceActionRepository {
  async list(scope: TenantScope) { return state.actions.filter((item) => scoped(scope, item)).map((item) => item.value); }
  async findById(scope: TenantScope, id: string) { return state.actions.find((item) => item.value.id === id && scoped(scope, item))?.value ?? null; }
  async save(scope: TenantScope, action: AssuranceAction) {
    const index = state.actions.findIndex((item) => item.value.id === action.id && scoped(scope, item));
    const record = { matId: scope.matId, academyId: scope.academyId, value: action };
    if (index >= 0) state.actions[index] = record; else state.actions.push(record);
    return action;
  }
}

export class DemoAuditProgrammeRepository implements AuditProgrammeRepository {
  async list(scope: TenantScope) { return state.programmes.filter((item) => item.matId === scope.matId).map((item) => item.value); }
  async findById(scope: TenantScope, id: string) { return state.programmes.find((item) => item.value.id === id && item.matId === scope.matId)?.value ?? null; }
  async save(scope: TenantScope, programme: AuditProgramme) {
    const index = state.programmes.findIndex((item) => item.value.id === programme.id && item.matId === scope.matId);
    const record = { matId: scope.matId, value: programme };
    if (index >= 0) state.programmes[index] = record; else state.programmes.push(record);
    return programme;
  }
}

export class DemoAuditFindingRepository implements AuditFindingRepository {
  async list(scope: TenantScope) { return state.findings.filter((item) => scoped(scope, item)).map((item) => item.value); }
  async findById(scope: TenantScope, id: string) { return state.findings.find((item) => item.value.id === id && scoped(scope, item))?.value ?? null; }
  async save(scope: TenantScope, finding: AuditFinding) {
    const index = state.findings.findIndex((item) => item.value.id === finding.id && scoped(scope, item));
    const record = { matId: scope.matId, academyId: scope.academyId, value: finding };
    if (index >= 0) state.findings[index] = record; else state.findings.push(record);
    return finding;
  }
}

export class DemoAssuranceRiskRepository implements AssuranceRiskRepository {
  async list(scope: TenantScope) { return state.risks.filter((item) => scoped(scope, item)).map((item) => item.value); }
  async findById(scope: TenantScope, id: string) { return state.risks.find((item) => item.value.id === id && scoped(scope, item))?.value ?? null; }
  async save(scope: TenantScope, risk: AssuranceRisk) {
    const index = state.risks.findIndex((item) => item.value.id === risk.id && scoped(scope, item));
    const record = { matId: scope.matId, academyId: scope.academyId, value: risk };
    if (index >= 0) state.risks[index] = record; else state.risks.push(record);
    return risk;
  }
}

export function resetAssuranceDemoState() {
  state.actions.length = 0; state.programmes.length = 0;
  state.findings.length = 0; state.risks.length = 0;
}
