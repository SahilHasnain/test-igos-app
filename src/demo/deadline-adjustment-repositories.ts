import { randomUUID } from "node:crypto";
import type { DeadlineAdjustment } from "@/src/domain/deadline-adjustments";
import type { TenantScope } from "@/src/domain/model";
import type { DeadlineAdjustmentRepository } from "@/src/appwrite/deadline-adjustment-repository";

interface Scoped<T> { matId: string; matterId: string; value: T }
const state: Scoped<DeadlineAdjustment>[] = [];

export class DemoDeadlineAdjustmentRepository implements DeadlineAdjustmentRepository {
  async listByMatterId(scope: TenantScope, matterId: string): Promise<readonly DeadlineAdjustment[]> {
    return state.filter(item => item.matId === scope.matId && item.matterId === matterId).map(item => item.value);
  }
  async save(scope: TenantScope, matterId: string, adjustment: DeadlineAdjustment): Promise<DeadlineAdjustment> {
    const record = { ...adjustment, id: adjustment.id || randomUUID() };
    state.push({ matId: scope.matId, matterId, value: record });
    return record;
  }
}

export function resetDeadlineAdjustmentDemoState() { state.length = 0; }
