import { describe, expect, it } from "vitest";
import type { AuditEvent, Matter, Membership, TenantScope } from "../src/domain/model";
import type { CreateMatterInput, MatterQuery, MatterRepository } from "../src/repositories/matter-repository";
import type { AuditRepository, NewAuditEvent } from "../src/repositories/audit-repository";
import { AuditService } from "../src/services/audit-service";
import { MatterService } from "../src/services/matter-service";

class Matters implements MatterRepository {
  values:Matter[]=[];
  async create(input:CreateMatterInput){const value:Matter={...input,id:"m1",status:"open",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),version:1};this.values.push(value);return value}
  async findById(scope:TenantScope,id:string){return this.values.find(x=>x.id===id&&x.matId===scope.matId)??null}
  async list(query:MatterQuery){return this.values.filter(x=>x.matId===query.matId)}
  async update(scope:TenantScope,id:string,expectedVersion:number,patch:Parameters<MatterRepository["update"]>[3]){const value=(await this.findById(scope,id))!;Object.assign(value,patch,{version:expectedVersion+1});return value}
}
class Audits implements AuditRepository {
  values:AuditEvent[]=[];
  async append(input:NewAuditEvent){const value:AuditEvent={...input,id:String(this.values.length+1),occurredAt:input.occurredAt??new Date().toISOString()};this.values.push(value);return value}
  async listForMatter(scope:TenantScope,matterId:string){return this.values.filter(x=>x.matId===scope.matId&&x.matterId===matterId)}
}
const membership:Membership={userId:"u1",matId:"mat-1",academyIds:["a1"],roles:["case-manager"]};
const context={user:{id:"u1",email:"u@example.org"},membership,correlationId:"c1"};

describe("matter service",()=>{
  it("creates an in-scope matter and audit event",async()=>{const matters=new Matters(),audits=new Audits(),service=new MatterService(matters,new AuditService(audits));const result=await service.create(context,{matId:"mat-1",academyId:"a1",reference:"SAR-1",type:"sar",title:"Subject access request",ownerUserId:"u1"});expect(result.version).toBe(1);expect(audits.values[0].action).toBe("matter.created")});
  it("denies cross-MAT creation",async()=>{const service=new MatterService(new Matters(),new AuditService(new Audits()));await expect(service.create(context,{matId:"mat-2",reference:"FOI-1",type:"foi",title:"Request",ownerUserId:"u1"})).rejects.toThrow("permission")});
});
