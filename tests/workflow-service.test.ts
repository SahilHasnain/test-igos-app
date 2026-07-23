import { describe,expect,it,beforeEach } from "vitest";
import { DemoAuditRepository,DemoMatterRepository,DemoWorkflowRepository,resetDemoState } from "../src/demo/repositories";
import { AuditService } from "../src/services/audit-service";
import { MatterService } from "../src/services/matter-service";
import { WorkflowService } from "../src/services/workflow-service";
import type { Membership } from "../src/domain/model";

const membership:Membership={userId:"u1",matId:"mat-1",academyIds:["a1"],roles:["dpo"]};
const context={user:{id:"u1",email:"u@example.org"},membership,correlationId:"corr-1"};

describe("case workflows",()=>{
  beforeEach(()=>resetDemoState());
  it("moves a SAR through a permitted stage and records audit",async()=>{
    const audits=new DemoAuditRepository();
    const matter=await new MatterService(new DemoMatterRepository(),new AuditService(audits)).create(context,{matId:"mat-1",academyId:"a1",reference:"SAR-1",type:"sar",title:"Request",ownerUserId:"u1"});
    const workflowService=new WorkflowService(new DemoWorkflowRepository(),new AuditService(audits));
    const result=await workflowService.transition(context,{matId:"mat-1",academyId:"a1",matterId:matter.id,to:"identity-verification",expectedVersion:1});
    expect(result.stage).toBe("identity-verification");
    expect((await audits.listForMatter({matId:"mat-1",academyId:"a1"},matter.id)).map(x=>x.action)).toContain("workflow.transitioned");
  });
  it("rejects an invalid stage jump",async()=>{
    const audits=new DemoAuditRepository();
    const matter=await new MatterService(new DemoMatterRepository(),new AuditService(audits)).create(context,{matId:"mat-1",academyId:"a1",reference:"BR-1",type:"breach",title:"Incident",ownerUserId:"u1"});
    await expect(new WorkflowService(new DemoWorkflowRepository(),new AuditService(audits)).transition(context,{matId:"mat-1",academyId:"a1",matterId:matter.id,to:"notification-decision",expectedVersion:1})).rejects.toThrow("not permitted");
  });
  it("requires a reason for a breach notification decision",async()=>{
    const audits=new DemoAuditRepository(),matters=new DemoMatterRepository(),workflows=new DemoWorkflowRepository();
    const matter=await new MatterService(matters,new AuditService(audits)).create(context,{matId:"mat-1",academyId:"a1",reference:"BR-2",type:"breach",title:"Incident",ownerUserId:"u1"});
    const service=new WorkflowService(workflows,new AuditService(audits));
    for(const to of ["containment","risk-assessment","notification-decision"] as const){const current=await workflows.findByMatterId({matId:"mat-1",academyId:"a1"},matter.id);await service.transition(context,{matId:"mat-1",academyId:"a1",matterId:matter.id,to,expectedVersion:current!.version})}
    const current=await workflows.findByMatterId({matId:"mat-1",academyId:"a1"},matter.id);
    await expect(service.transition(context,{matId:"mat-1",academyId:"a1",matterId:matter.id,to:"investigation",expectedVersion:current!.version})).rejects.toThrow("reason");
  });
});
