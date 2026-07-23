import type { Matter, MatterStatus, MatterType, TenantScope } from "@/src/domain/model";
export interface CreateMatterInput extends TenantScope { reference:string; type:MatterType; title:string; ownerUserId:string; statutoryDueAt?:string }
export interface MatterQuery extends TenantScope { type?:MatterType; status?:MatterStatus; ownerUserId?:string }
export type MatterPatch = Partial<Pick<Matter,"title"|"status"|"ownerUserId">> & { statutoryDueAt?: string | null };
export interface MatterRepository {
  create(input:CreateMatterInput):Promise<Matter>;
  findById(scope:TenantScope,id:string):Promise<Matter|null>;
  list(query:MatterQuery):Promise<readonly Matter[]>;
  update(scope:TenantScope,id:string,expectedVersion:number,patch:MatterPatch):Promise<Matter>;
}
