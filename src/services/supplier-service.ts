import { can } from "@/src/domain/authorisation";
import type { RequestContext } from "@/src/auth/context";
import { requireContext } from "@/src/auth/context";
import type { TenantScope } from "@/src/domain/model";
import type { SupplierAssessment, TransferAssessment } from "@/src/domain/supplier";
import { AuditService } from "./audit-service";
import { ForbiddenError } from "./matter-service";

export interface SupplierRepository {
  listAssessments(scope: TenantScope): Promise<readonly SupplierAssessment[]>;
  findAssessmentById(scope: TenantScope, id: string): Promise<SupplierAssessment | null>;
  saveAssessment(scope: TenantScope, assessment: SupplierAssessment): Promise<SupplierAssessment>;
  listTransferAssessments(scope: TenantScope): Promise<readonly TransferAssessment[]>;
  findTransferAssessmentById(scope: TenantScope, id: string): Promise<TransferAssessment | null>;
  saveTransferAssessment(scope: TenantScope, assessment: TransferAssessment): Promise<TransferAssessment>;
}

function assertAllowed(context: RequestContext, scope: TenantScope, capability: Parameters<typeof can>[2]) {
  if (!can(context.membership, scope, capability)) throw new ForbiddenError();
}

export class SupplierService {
  constructor(private readonly repository: SupplierRepository, private readonly audit: AuditService) {}

  async listAssessments(raw: RequestContext, scope: TenantScope): Promise<readonly SupplierAssessment[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.listAssessments(scope);
  }

  async saveAssessment(raw: RequestContext, scope: TenantScope, assessment: SupplierAssessment): Promise<SupplierAssessment> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.repository.saveAssessment(scope, assessment);
    await this.audit.record(context, scope, "supplier.assessment.saved", { assessmentId: assessment.id, supplierName: assessment.supplierName, status: assessment.status });
    return saved;
  }

  async listTransferAssessments(raw: RequestContext, scope: TenantScope): Promise<readonly TransferAssessment[]> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "report:read");
    return this.repository.listTransferAssessments(scope);
  }

  async saveTransferAssessment(raw: RequestContext, scope: TenantScope, assessment: TransferAssessment): Promise<TransferAssessment> {
    const context = requireContext(raw);
    assertAllowed(context, scope, "matter:update");
    const saved = await this.repository.saveTransferAssessment(scope, assessment);
    await this.audit.record(context, scope, "transfer.assessment.saved", { assessmentId: assessment.id, supplierId: assessment.supplierId });
    return saved;
  }
}
