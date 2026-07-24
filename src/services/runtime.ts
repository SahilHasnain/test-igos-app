import { readServerEnvironment } from "@/src/config/env";
import { resolveRequestContext } from "@/src/auth/appwrite-context";
import { resolveDemoContext } from "@/src/demo/context";
import { DemoAuditRepository, DemoMatterRepository, DemoWorkflowRepository } from "@/src/demo/repositories";
import { DemoDpiaRepository, DemoPolicyRepository, DemoRopaRepository } from "@/src/demo/governance-repositories";
import { DemoAssuranceActionRepository, DemoAuditProgrammeRepository, DemoAuditFindingRepository, DemoAssuranceRiskRepository } from "@/src/demo/assurance-repositories";
import { DemoAiSystemRepository, DemoInformationAssetRepository, DemoRetentionRuleRepository, DemoRecordInstanceRepository, DemoRecordsHoldRepository, DemoContractGovernanceRepository } from "@/src/demo/advanced-governance-repositories";
import { DemoSupplierRepository } from "@/src/demo/supplier-repositories";
import { DemoDeadlineAdjustmentRepository } from "@/src/demo/deadline-adjustment-repositories";
import { DemoRedactionAnalysisRepository, DemoRedactionSuggestionRepository, DemoSecondReviewRepository, DemoRedactionManifestRepository } from "@/src/demo/redaction-repositories";
import { createMatterService as createAppwriteMatterService, createWorkflowService as createAppwriteWorkflowService, createGovernanceServices as createAppwriteGovernanceServices, createAssuranceRepositories, createAdvancedGovernanceRepositories, createSupplierRepository, createDeadlineAdjustmentRepository, createRedactionRepositories } from "@/src/appwrite/services";
import { AuditService } from "./audit-service";
import { MatterService } from "./matter-service";
import { WorkflowService } from "./workflow-service";
import { DpiaGovernanceService, RopaGovernanceService, PolicyGovernanceService } from "./governance-service";
import { AssuranceActionService, AuditProgrammeService, AuditFindingService, AssuranceRiskService } from "./assurance-service";
import { AiSystemService, InformationAssetService, RetentionRuleService, RecordInstanceService, RecordsHoldService, ContractGovernanceService } from "./advanced-governance-service";
import { SupplierService } from "./supplier-service";

const demoAudit=new DemoAuditRepository();
const demoMatters=new DemoMatterRepository();
const demoWorkflows=new DemoWorkflowRepository();
const demoDpia=new DemoDpiaRepository();
const demoRopa=new DemoRopaRepository();
const demoPolicy=new DemoPolicyRepository();
const demoAssuranceActions=new DemoAssuranceActionRepository();
const demoAuditProgrammes=new DemoAuditProgrammeRepository();
const demoAuditFindings=new DemoAuditFindingRepository();
const demoAssuranceRisks=new DemoAssuranceRiskRepository();
const demoAiSystems=new DemoAiSystemRepository();
const demoAssets=new DemoInformationAssetRepository();
const demoRetentionRules=new DemoRetentionRuleRepository();
const demoRecordInstances=new DemoRecordInstanceRepository();
const demoRecordsHolds=new DemoRecordsHoldRepository();
const demoContracts=new DemoContractGovernanceRepository();
const demoSuppliers=new DemoSupplierRepository();
const demoDeadlineAdjustments=new DemoDeadlineAdjustmentRepository();
const demoRedactionAnalysis=new DemoRedactionAnalysisRepository();
const demoRedactionSuggestions=new DemoRedactionSuggestionRepository();
const demoSecondReviews=new DemoSecondReviewRepository();
const demoRedactionManifests=new DemoRedactionManifestRepository();
const auditService=new AuditService(demoAudit);

export const dataMode=()=>readServerEnvironment().IGOS_DATA_MODE;

export function createRuntimeMatterService(){return dataMode()==="demo"?new MatterService(demoMatters,auditService):createAppwriteMatterService()}
export function createRuntimeWorkflowService(){return dataMode()==="demo"?new WorkflowService(demoWorkflows,auditService):createAppwriteWorkflowService()}
export async function resolveRuntimeContext(request:Request,matId:string){return dataMode()==="demo"?resolveDemoContext(request,matId):resolveRequestContext(request,matId)}

export function createRuntimeGovernanceServices(){
  if(dataMode()==="demo"){
    return{
      dpia:new DpiaGovernanceService(demoDpia,auditService),
      ropa:new RopaGovernanceService(demoRopa,auditService),
      policy:new PolicyGovernanceService(demoPolicy,auditService),
    };
  }
  return createAppwriteGovernanceServices();
}

export function createRuntimeAssuranceServices(){
  if(dataMode()==="demo"){
    return{
      actions:new AssuranceActionService(demoAssuranceActions,auditService),
      programmes:new AuditProgrammeService(demoAuditProgrammes,auditService),
      findings:new AuditFindingService(demoAuditFindings,auditService),
      risks:new AssuranceRiskService(demoAssuranceRisks,auditService),
    };
  }
  const repos=createAssuranceRepositories();
  return{
    actions:new AssuranceActionService(repos.actions,auditService),
    programmes:new AuditProgrammeService(repos.programmes,auditService),
    findings:new AuditFindingService(repos.findings,auditService),
    risks:new AssuranceRiskService(repos.risks,auditService),
  };
}

export function createRuntimeAdvancedGovernanceServices(){
  if(dataMode()==="demo"){
    return{
      aiSystems:new AiSystemService(demoAiSystems,auditService),
      assets:new InformationAssetService(demoAssets,auditService),
      retentionRules:new RetentionRuleService(demoRetentionRules,auditService),
      records:new RecordInstanceService(demoRecordInstances,demoRecordsHolds,auditService),
      holds:new RecordsHoldService(demoRecordsHolds,auditService),
      contracts:new ContractGovernanceService(demoContracts,auditService),
    };
  }
  const repos=createAdvancedGovernanceRepositories();
  return{
    aiSystems:new AiSystemService(repos.aiSystems,auditService),
    assets:new InformationAssetService(repos.informationAssets,auditService),
    retentionRules:new RetentionRuleService(repos.retentionRules,auditService),
    records:new RecordInstanceService(repos.recordInstances,repos.recordsHolds,auditService),
    holds:new RecordsHoldService(repos.recordsHolds,auditService),
    contracts:new ContractGovernanceService(repos.contractGovernance,auditService),
  };
}

export function createRuntimeSupplierService(){
  if(dataMode()==="demo"){
    return new SupplierService(demoSuppliers,auditService);
  }
  return new SupplierService(createSupplierRepository(),auditService);
}

export function createRuntimeDeadlineAdjustmentRepository(){
  if(dataMode()==="demo") return demoDeadlineAdjustments;
  return createDeadlineAdjustmentRepository();
}

export function createRuntimeRedactionRepositories(){
  if(dataMode()==="demo"){
    return{
      analysis:demoRedactionAnalysis,
      suggestions:demoRedactionSuggestions,
      secondReviews:demoSecondReviews,
      manifests:demoRedactionManifests,
    };
  }
  return createRedactionRepositories();
}
