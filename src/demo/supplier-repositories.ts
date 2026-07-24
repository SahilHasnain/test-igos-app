import type { SupplierAssessment, TransferAssessment } from "@/src/domain/supplier";
import type { TenantScope } from "@/src/domain/model";
import type { SupplierRepository } from "@/src/services/supplier-service";

type Scoped<T> = { matId: string; value: T };

const state = {
  assessments: [] as Scoped<SupplierAssessment>[],
  transfers: [] as Scoped<TransferAssessment>[],
};

export class DemoSupplierRepository implements SupplierRepository {
  async listAssessments(scope: TenantScope) { return state.assessments.filter((item) => item.matId === scope.matId).map((item) => item.value); }
  async findAssessmentById(scope: TenantScope, id: string) { return state.assessments.find((item) => item.value.id === id && item.matId === scope.matId)?.value ?? null; }
  async saveAssessment(scope: TenantScope, assessment: SupplierAssessment) {
    const index = state.assessments.findIndex((item) => item.value.id === assessment.id && item.matId === scope.matId);
    const record = { matId: scope.matId, value: assessment };
    if (index >= 0) state.assessments[index] = record; else state.assessments.push(record);
    return assessment;
  }
  async listTransferAssessments(scope: TenantScope) { return state.transfers.filter((item) => item.matId === scope.matId).map((item) => item.value); }
  async findTransferAssessmentById(scope: TenantScope, id: string) { return state.transfers.find((item) => item.value.id === id && item.matId === scope.matId)?.value ?? null; }
  async saveTransferAssessment(scope: TenantScope, assessment: TransferAssessment) {
    const index = state.transfers.findIndex((item) => item.value.id === assessment.id && item.matId === scope.matId);
    const record = { matId: scope.matId, value: assessment };
    if (index >= 0) state.transfers[index] = record; else state.transfers.push(record);
    return assessment;
  }
}

export function resetSupplierDemoState() {
  state.assessments.length = 0; state.transfers.length = 0;
}
