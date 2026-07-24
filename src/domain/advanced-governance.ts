export interface AiSystemRecord {
  id: string;
  matId: string;
  name: string;
  purpose: string;
  ownerUserId: string;
  supplierId?: string;
  modelProvider: string;
  modelReference: string;
  riskTier: "prohibited" | "high" | "limited" | "minimal";
  status: "proposed" | "assessment" | "approved-pilot" | "approved-production" | "suspended" | "retired";
  personalDataUsed: boolean;
  specialCategoryDataUsed: boolean;
  automatedDecisionSignificantEffect: boolean;
  humanOversightDescription: string;
  explainabilityDescription: string;
  trainingDataDescription?: string;
  dpiaId?: string;
  supplierAssessmentId?: string;
  monitoringMetrics: readonly string[];
  reviewDueAt: string;
  approvedByUserId?: string;
  approvalRationale?: string;
}

export interface InformationAsset {
  id: string;
  matId: string;
  academyIds: readonly string[];
  name: string;
  assetType: "system" | "dataset" | "document-collection" | "physical-records" | "integration";
  ownerUserId: string;
  administratorUserId?: string;
  classification: "public" | "internal" | "confidential" | "restricted";
  criticality: "low" | "medium" | "high" | "critical";
  hostingLocations: readonly string[];
  containsPersonalData: boolean;
  containsSpecialCategoryData: boolean;
  ropaActivityIds: readonly string[];
  dpiaIds: readonly string[];
  supplierIds: readonly string[];
  retentionRuleIds: readonly string[];
  recoveryTimeHours?: number;
  recoveryPointHours?: number;
  lastReviewedAt?: string;
  nextReviewAt: string;
  status: "active" | "under-review" | "retiring" | "retired";
}

export interface RetentionRule {
  id: string;
  matId: string;
  name: string;
  recordCategory: string;
  trigger: "creation" | "closure" | "pupil-leaves" | "employment-ends" | "contract-ends" | "superseded";
  periodMonths: number;
  disposition: "review" | "destroy" | "transfer-to-archive";
  authority: string;
  approvedByUserId: string;
  effectiveAt: string;
}

export interface RecordInstance {
  id: string;
  matId: string;
  academyId?: string;
  assetId: string;
  retentionRuleId: string;
  triggerAt: string;
  dispositionDueAt: string;
  status: "active" | "held" | "eligible" | "approved-for-disposal" | "disposed" | "archived";
  disposalEvidenceDocumentId?: string;
}

export interface RecordsHold {
  id: string;
  matId: string;
  academyId?: string;
  name: string;
  reason: "legal" | "sar" | "foi" | "investigation" | "audit" | "regulatory";
  matterId?: string;
  recordIds: readonly string[];
  assetIds: readonly string[];
  imposedByUserId: string;
  imposedAt: string;
  releasedByUserId?: string;
  releasedAt?: string;
  releaseRationale?: string;
}

export interface ContractGovernanceRecord {
  id: string;
  matId: string;
  supplierId: string;
  title: string;
  ownerUserId: string;
  startsAt: string;
  expiresAt: string;
  renewalNoticeAt: string;
  dataProcessingTerms: boolean;
  confidentialityTerms: boolean;
  auditRights: boolean;
  subprocessorApprovalRequired: boolean;
  breachNotificationHours?: number;
  returnOrDeletionTerms: boolean;
  exitPlanDocumentId?: string;
  status: "draft" | "review" | "approved" | "expiring" | "terminated";
  offboardingCompletedAt?: string;
  deletionEvidenceDocumentId?: string;
}

export function validateAiSystemApproval(system: AiSystemRecord) {
  if (system.riskTier === "prohibited") throw new Error("A prohibited AI use cannot be approved");
  if (!system.humanOversightDescription.trim()) throw new Error("AI approval requires documented human oversight");
  if (!system.explainabilityDescription.trim()) throw new Error("AI approval requires documented explainability");
  if (system.riskTier === "high" && (!system.dpiaId || !system.supplierAssessmentId || !system.monitoringMetrics.length)) throw new Error("High-risk AI requires a DPIA, supplier assessment and monitoring metrics");
  if ((system.status === "approved-pilot" || system.status === "approved-production") && (!system.approvedByUserId || !system.approvalRationale?.trim())) throw new Error("AI approval requires a named approver and rationale");
  return system;
}

export function validateInformationAsset(asset: InformationAsset) {
  if ((asset.classification === "restricted" || asset.criticality === "critical") && !asset.recoveryTimeHours) throw new Error("Restricted or critical assets require recovery objectives");
  if (asset.containsSpecialCategoryData && !asset.ropaActivityIds.length) throw new Error("Assets containing special-category data require ROPA linkage");
  return asset;
}

export function calculateDispositionDueAt(rule: RetentionRule, triggerAt: Date) {
  if (!Number.isInteger(rule.periodMonths) || rule.periodMonths < 0) throw new Error("Retention period must be a non-negative whole number of months");
  const due = new Date(triggerAt);
  const originalDay = due.getUTCDate();
  due.setUTCDate(1); due.setUTCMonth(due.getUTCMonth() + rule.periodMonths);
  const lastDay = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth() + 1, 0)).getUTCDate();
  due.setUTCDate(Math.min(originalDay, lastDay));
  return due;
}

export function disposalEligibility(record: RecordInstance, holds: readonly RecordsHold[], now = new Date()) {
  const activeHolds = holds.filter((hold) => !hold.releasedAt && hold.matId === record.matId && (hold.recordIds.includes(record.id) || hold.assetIds.includes(record.assetId)));
  if (activeHolds.length) return { eligible: false, reason: "active-hold", holdIds: activeHolds.map((hold) => hold.id) } as const;
  if (new Date(record.dispositionDueAt) > now) return { eligible: false, reason: "retention-period", holdIds: [] } as const;
  if (record.status === "disposed" || record.status === "archived") return { eligible: false, reason: "already-disposed", holdIds: [] } as const;
  return { eligible: true, reason: "retention-complete", holdIds: [] } as const;
}

export function assertContractApproval(record: ContractGovernanceRecord) {
  if (!record.dataProcessingTerms || !record.confidentialityTerms || !record.auditRights || !record.returnOrDeletionTerms) throw new Error("Contract approval requires mandatory information-governance terms");
  if (!record.breachNotificationHours || record.breachNotificationHours > 72) throw new Error("Contract approval requires a breach-notification commitment of 72 hours or less");
  return record;
}

export function assertSupplierOffboarding(record: ContractGovernanceRecord) {
  if (!record.offboardingCompletedAt || !record.deletionEvidenceDocumentId) throw new Error("Supplier offboarding requires completion and deletion evidence");
  return record;
}
