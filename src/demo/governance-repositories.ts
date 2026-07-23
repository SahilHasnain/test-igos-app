import type { DpiaRisk, DpiaSection } from "@/src/domain/dpia";
import type { PolicyAcknowledgement, PolicyException, PolicyRecord } from "@/src/domain/policy";
import type { ProcessingActivity } from "@/src/domain/ropa";
import type { TenantScope } from "@/src/domain/model";
import type { DpiaRepository, PolicyRepository, RopaRepository } from "@/src/repositories/governance-repository";

type Scoped<T> = { matId: string; academyId?: string; value: T };
type DpiaRecord<T> = Scoped<T> & { matterId: string };

const state = {
  sections: [] as DpiaRecord<DpiaSection>[],
  risks: [] as DpiaRecord<DpiaRisk>[],
  activities: [] as ProcessingActivity[],
  policies: [] as PolicyRecord[],
  acknowledgements: [] as Scoped<PolicyAcknowledgement>[],
  exceptions: [] as Scoped<PolicyException>[],
};

const academyAllowed = (scope: TenantScope, academyIds: readonly string[]) => !scope.academyId || academyIds.includes(scope.academyId);
const scoped = <T extends Scoped<unknown>>(scope: TenantScope, item: T) => item.matId === scope.matId && (!scope.academyId || item.academyId === scope.academyId);

export class DemoDpiaRepository implements DpiaRepository {
  async listSections(scope: TenantScope, matterId: string) { return state.sections.filter((item) => item.matterId === matterId && scoped(scope, item)).map((item) => item.value); }
  async saveSection(scope: TenantScope, matterId: string, section: DpiaSection) {
    const index = state.sections.findIndex((item) => item.matterId === matterId && item.value.id === section.id && scoped(scope, item));
    const record = { ...scope, matterId, value: section };
    if (index >= 0) state.sections[index] = record; else state.sections.push(record);
    return section;
  }
  async listRisks(scope: TenantScope, matterId: string) { return state.risks.filter((item) => item.matterId === matterId && scoped(scope, item)).map((item) => item.value); }
  async saveRisk(scope: TenantScope, matterId: string, risk: DpiaRisk) {
    const index = state.risks.findIndex((item) => item.matterId === matterId && item.value.id === risk.id && scoped(scope, item));
    const record = { ...scope, matterId, value: risk };
    if (index >= 0) state.risks[index] = record; else state.risks.push(record);
    return risk;
  }
}

export class DemoRopaRepository implements RopaRepository {
  async list(scope: TenantScope) { return state.activities.filter((item) => item.matId === scope.matId && academyAllowed(scope, item.academyIds)); }
  async findById(scope: TenantScope, id: string) { return state.activities.find((item) => item.id === id && item.matId === scope.matId && academyAllowed(scope, item.academyIds)) ?? null; }
  async save(scope: TenantScope, activity: ProcessingActivity) {
    if (activity.matId !== scope.matId || !academyAllowed(scope, activity.academyIds)) throw new Error("Processing activity is outside the authorised scope");
    const index = state.activities.findIndex((item) => item.id === activity.id && item.matId === scope.matId);
    if (index >= 0) state.activities[index] = activity; else state.activities.push(activity);
    return activity;
  }
}

export class DemoPolicyRepository implements PolicyRepository {
  async list(scope: TenantScope) { return state.policies.filter((item) => item.matId === scope.matId && academyAllowed(scope, item.academyIds)); }
  async findById(scope: TenantScope, id: string) { return state.policies.find((item) => item.id === id && item.matId === scope.matId && academyAllowed(scope, item.academyIds)) ?? null; }
  async save(scope: TenantScope, policy: PolicyRecord) {
    if (policy.matId !== scope.matId || !academyAllowed(scope, policy.academyIds)) throw new Error("Policy is outside the authorised scope");
    const index = state.policies.findIndex((item) => item.id === policy.id && item.matId === scope.matId);
    if (index >= 0) state.policies[index] = policy; else state.policies.push(policy);
    return policy;
  }
  async listAcknowledgements(scope: TenantScope, policyId: string) { return state.acknowledgements.filter((item) => item.value.policyId === policyId && scoped(scope, item)).map((item) => item.value); }
  async saveAcknowledgement(scope: TenantScope, acknowledgement: PolicyAcknowledgement) { state.acknowledgements.push({ ...scope, value: acknowledgement }); return acknowledgement; }
  async saveException(scope: TenantScope, exception: PolicyException) { state.exceptions.push({ ...scope, value: exception }); return exception; }
}

export function resetGovernanceDemoState() {
  state.sections.length = 0; state.risks.length = 0; state.activities.length = 0;
  state.policies.length = 0; state.acknowledgements.length = 0; state.exceptions.length = 0;
}
