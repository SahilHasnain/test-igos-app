import { randomUUID } from "node:crypto";
import type { AuditEvent, Matter, TenantScope } from "@/src/domain/model";
import type { CaseWorkflow, WorkflowStage } from "@/src/domain/workflow";
import type { AuditRepository, NewAuditEvent } from "@/src/repositories/audit-repository";
import type { CreateMatterInput, MatterQuery, MatterRepository, MatterPatch } from "@/src/repositories/matter-repository";
import type { WorkflowRepository } from "@/src/repositories/workflow-repository";
import { initialStage } from "@/src/domain/workflow";

type DemoState={matters:Matter[];audit:AuditEvent[];workflows:CaseWorkflow[]};
const state:DemoState={matters:[],audit:[],workflows:[]};

export class DemoMatterRepository implements MatterRepository {
  async create(input:CreateMatterInput){const now=new Date().toISOString();const matter:Matter={...input,id:randomUUID(),status:"open",createdAt:now,updatedAt:now,version:1};state.matters.push(matter);state.workflows.push({...input,matterId:matter.id,type:input.type,stage:initialStage(input.type),assignedUserId:input.ownerUserId,completedStages:[],updatedAt:now,version:1});return matter}
  async findById(scope:TenantScope,id:string){return state.matters.find(item=>item.id===id&&item.matId===scope.matId&&(!scope.academyId||item.academyId===scope.academyId))??null}
  async list(query:MatterQuery){return state.matters.filter(item=>item.matId===query.matId&&(!query.academyId||item.academyId===query.academyId)&&(!query.type||item.type===query.type)&&(!query.status||item.status===query.status)&&(!query.ownerUserId||item.ownerUserId===query.ownerUserId))}
  async update(scope:TenantScope,id:string,expectedVersion:number,patch:MatterPatch){const matter=await this.findById(scope,id);if(!matter)throw new Error("Matter not found");if(matter.version!==expectedVersion)throw new Error("Version conflict");Object.assign(matter,patch,{statutoryDueAt:patch.statutoryDueAt??undefined,updatedAt:new Date().toISOString(),version:matter.version+1});return matter}
}
export class DemoAuditRepository implements AuditRepository {
  async append(event:NewAuditEvent){const stored:AuditEvent={...event,id:randomUUID(),occurredAt:event.occurredAt??new Date().toISOString()};state.audit.push(stored);return stored}
  async listForMatter(scope:TenantScope,matterId:string){return state.audit.filter(item=>item.matId===scope.matId&&item.matterId===matterId)}
}
export class DemoWorkflowRepository implements WorkflowRepository {
  async create(workflow:CaseWorkflow){state.workflows.push(workflow);return workflow}
  async findByMatterId(scope:TenantScope,matterId:string){return state.workflows.find(item=>item.matterId===matterId&&item.matId===scope.matId&&(!scope.academyId||item.academyId===scope.academyId))??null}
  async transition(scope:TenantScope,matterId:string,expectedVersion:number,to:WorkflowStage,completedStages:readonly string[],assignedUserId?:string){const workflow=await this.findByMatterId(scope,matterId);if(!workflow)throw new Error("Workflow not found");if(workflow.version!==expectedVersion)throw new Error("Version conflict");Object.assign(workflow,{stage:to,completedStages,assignedUserId:assignedUserId??workflow.assignedUserId,updatedAt:new Date().toISOString(),version:workflow.version+1});return workflow}
}
export const resetDemoState=()=>{state.matters.length=0;state.audit.length=0;state.workflows.length=0};
