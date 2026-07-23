import { can } from "@/src/domain/authorisation";
import type { RequestContext } from "@/src/auth/context";
import { requireContext } from "@/src/auth/context";
import type { TenantScope } from "@/src/domain/model";
import { findTransition, type WorkflowStage } from "@/src/domain/workflow";
import type { WorkflowRepository } from "@/src/repositories/workflow-repository";
import { AuditService } from "./audit-service";
import { ForbiddenError } from "./matter-service";

export interface TransitionInput extends TenantScope {
  matterId:string;
  to:WorkflowStage;
  expectedVersion:number;
  reason?:string;
  assignedUserId?:string;
}

export class WorkflowService {
  constructor(private readonly workflows:WorkflowRepository,private readonly audit:AuditService){}

  async transition(rawContext:RequestContext,input:TransitionInput){
    const context=requireContext(rawContext);
    const current=await this.workflows.findByMatterId(input,input.matterId);
    if(!current) throw new Error("Case workflow was not found");
    const definition=findTransition(current.type,current.stage,input.to);
    if(!can(context.membership,input,definition.capability)) throw new ForbiddenError();
    if(definition.requiresReason&&!input.reason?.trim()) throw new Error("A recorded reason is required for this transition");
    const completed=[...new Set([...current.completedStages,current.stage])];
    const updated=await this.workflows.transition(input,input.matterId,input.expectedVersion,input.to,completed,input.assignedUserId);
    await this.audit.record(context,input,"workflow.transitioned",{from:current.stage,to:updated.stage,reason:input.reason??null,version:updated.version},input.matterId);
    return updated;
  }
}
