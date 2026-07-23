import type { TenantScope } from "@/src/domain/model";
import type { CaseWorkflow, WorkflowStage } from "@/src/domain/workflow";

export interface WorkflowRepository {
  create(workflow:CaseWorkflow):Promise<CaseWorkflow>;
  findByMatterId(scope:TenantScope,matterId:string):Promise<CaseWorkflow|null>;
  transition(scope:TenantScope,matterId:string,expectedVersion:number,to:WorkflowStage,completedStages:readonly string[],assignedUserId?:string):Promise<CaseWorkflow>;
}
