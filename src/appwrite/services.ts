import { readServerEnvironment } from "@/src/config/env";
import { createAppwriteAdmin } from "./server";
import { AppwriteMatterRepository } from "./matter-repository";
import { AppwriteAuditRepository } from "./audit-repository";
import { AppwriteWorkflowRepository } from "./workflow-repository";
import { AppwriteDeadlineAdjustmentRepository } from "./deadline-adjustment-repository";
import { AppwriteNotificationReceiptStore } from "./notification-receipt-repository";
import { AppwriteDpiaRepository } from "./dpia-repository";
import { AppwriteRopaRepository } from "./ropa-repository";
import { AppwritePolicyRepository } from "./policy-repository";
import { AppwriteSupplierRepository } from "./supplier-repository";
import { AppwriteAssuranceActionRepository } from "./assurance-action-repository";
import { AppwriteAuditProgrammeRepository } from "./audit-programme-repository";
import { AppwriteAuditFindingRepository } from "./audit-finding-repository";
import { AppwriteAssuranceRiskRepository } from "./assurance-risk-repository";
import { AppwriteEvidencePackRepository } from "./evidence-pack-repository";
import { AppwriteRedactionAnalysisRepository } from "./redaction-analysis-repository";
import { AppwriteRedactionSuggestionRepository } from "./redaction-suggestion-repository";
import { AppwriteSecondReviewRepository } from "./second-review-repository";
import { AppwriteRedactionManifestRepository } from "./redaction-manifest-repository";
import { AppwriteAiSystemRepository } from "./ai-system-repository";
import { AppwriteInformationAssetRepository } from "./information-asset-repository";
import { AppwriteRetentionRuleRepository } from "./retention-rule-repository";
import { AppwriteRecordInstanceRepository } from "./record-instance-repository";
import { AppwriteRecordsHoldRepository } from "./records-hold-repository";
import { AppwriteContractGovernanceRepository } from "./contract-governance-repository";
import { AuditService } from "@/src/services/audit-service";
import { MatterService } from "@/src/services/matter-service";
import { WorkflowService } from "@/src/services/workflow-service";
import { DpiaGovernanceService, RopaGovernanceService, PolicyGovernanceService } from "@/src/services/governance-service";

function getEnv() {
  return readServerEnvironment();
}

function getAdmin() {
  return createAppwriteAdmin();
}

export function createMatterService() {
  const env = getEnv();
  const admin = getAdmin();
  const matters = new AppwriteMatterRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_CASES_TABLE_ID);
  const auditRepository = new AppwriteAuditRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_AUDIT_TABLE_ID);
  return new MatterService(matters, new AuditService(auditRepository));
}

export function createWorkflowService() {
  const env = getEnv();
  const admin = getAdmin();
  const workflows = new AppwriteWorkflowRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_WORKFLOWS_TABLE_ID);
  const auditRepository = new AppwriteAuditRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_AUDIT_TABLE_ID);
  return new WorkflowService(workflows, new AuditService(auditRepository));
}

export function createGovernanceServices() {
  const env = getEnv();
  const admin = getAdmin();
  const auditRepository = new AppwriteAuditRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_AUDIT_TABLE_ID);
  const audit = new AuditService(auditRepository);
  
  const dpia = new DpiaGovernanceService(
    new AppwriteDpiaRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_DPIA_SECTIONS_TABLE_ID, env.APPWRITE_DPIA_RISKS_TABLE_ID),
    audit
  );
  const ropa = new RopaGovernanceService(
    new AppwriteRopaRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_PROCESSING_ACTIVITIES_TABLE_ID),
    audit
  );
  const policy = new PolicyGovernanceService(
    new AppwritePolicyRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_POLICIES_TABLE_ID, env.APPWRITE_POLICY_ACKNOWLEDGEMENTS_TABLE_ID, env.APPWRITE_POLICY_EXCEPTIONS_TABLE_ID),
    audit
  );
  
  return { dpia, ropa, policy };
}

export function createSupplierRepository() {
  const env = getEnv();
  const admin = getAdmin();
  return new AppwriteSupplierRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_SUPPLIER_ASSESSMENTS_TABLE_ID, env.APPWRITE_TRANSFER_ASSESSMENTS_TABLE_ID);
}

export function createAssuranceRepositories() {
  const env = getEnv();
  const admin = getAdmin();
  return {
    actions: new AppwriteAssuranceActionRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_ASSURANCE_ACTIONS_TABLE_ID),
    programmes: new AppwriteAuditProgrammeRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_AUDIT_PROGRAMMES_TABLE_ID),
    findings: new AppwriteAuditFindingRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_AUDIT_FINDINGS_TABLE_ID),
    risks: new AppwriteAssuranceRiskRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_ASSURANCE_RISKS_TABLE_ID),
    evidence: new AppwriteEvidencePackRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_EVIDENCE_PACKS_TABLE_ID),
  };
}

export function createRedactionRepositories() {
  const env = getEnv();
  const admin = getAdmin();
  return {
    analysis: new AppwriteRedactionAnalysisRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_REDACTION_ANALYSIS_TABLE_ID),
    suggestions: new AppwriteRedactionSuggestionRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_REDACTION_SUGGESTIONS_TABLE_ID),
    secondReviews: new AppwriteSecondReviewRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_SECOND_REVIEWS_TABLE_ID),
    manifests: new AppwriteRedactionManifestRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_REDACTION_MANIFESTS_TABLE_ID),
  };
}

export function createAdvancedGovernanceRepositories() {
  const env = getEnv();
  const admin = getAdmin();
  return {
    aiSystems: new AppwriteAiSystemRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_AI_SYSTEMS_TABLE_ID),
    informationAssets: new AppwriteInformationAssetRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_INFORMATION_ASSETS_TABLE_ID),
    retentionRules: new AppwriteRetentionRuleRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_RETENTION_RULES_TABLE_ID),
    recordInstances: new AppwriteRecordInstanceRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_RECORD_INSTANCES_TABLE_ID),
    recordsHolds: new AppwriteRecordsHoldRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_RECORDS_HOLDS_TABLE_ID),
    contractGovernance: new AppwriteContractGovernanceRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_CONTRACT_GOVERNANCE_TABLE_ID),
  };
}

export function createDeadlineAdjustmentRepository() {
  const env = getEnv();
  const admin = getAdmin();
  return new AppwriteDeadlineAdjustmentRepository(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_DEADLINE_ADJUSTMENTS_TABLE_ID);
}

export function createNotificationReceiptStore() {
  const env = getEnv();
  const admin = getAdmin();
  return new AppwriteNotificationReceiptStore(admin.databases, env.APPWRITE_DATABASE_ID, env.APPWRITE_NOTIFICATION_RECEIPTS_TABLE_ID);
}
