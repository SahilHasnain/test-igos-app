import { ID, Query, type Databases } from "node-appwrite";
import type { Matter, TenantScope } from "@/src/domain/model";
import type { CreateMatterInput, MatterQuery, MatterRepository } from "@/src/repositories/matter-repository";
import { toMatter } from "./mappers";
export class VersionConflictError extends Error { constructor(){super("The matter was changed by another user");this.name="VersionConflictError"} }
const mapped=(document:unknown)=>toMatter(document as Parameters<typeof toMatter>[0]);
export class AppwriteMatterRepository implements MatterRepository {
  constructor(private readonly databases:Databases,private readonly databaseId:string,private readonly collectionId:string){}
  async create(input:CreateMatterInput){return mapped(await this.databases.createDocument(this.databaseId,this.collectionId,ID.unique(),{...input,academyId:input.academyId??null,statutoryDueAt:input.statutoryDueAt??null,status:"open",version:1}))}
  async findById(scope:TenantScope,id:string){try{const matter=mapped(await this.databases.getDocument(this.databaseId,this.collectionId,id));if(matter.matId!==scope.matId||(scope.academyId&&matter.academyId!==scope.academyId))return null;return matter}catch(error){if(typeof error==="object"&&error&&"code"in error&&error.code===404)return null;throw error}}
  async list(query:MatterQuery){const filters=[Query.equal("matId",query.matId),Query.orderDesc("$createdAt"),Query.limit(100)];if(query.academyId)filters.push(Query.equal("academyId",query.academyId));if(query.type)filters.push(Query.equal("type",query.type));if(query.status)filters.push(Query.equal("status",query.status));if(query.ownerUserId)filters.push(Query.equal("ownerUserId",query.ownerUserId));const result=await this.databases.listDocuments(this.databaseId,this.collectionId,filters);return result.documents.map(mapped)}
  async update(scope:TenantScope,id:string,expectedVersion:number,patch:Parameters<MatterRepository["update"]>[3]){const current=await this.findById(scope,id);if(!current)throw new Error("Matter not found");if(current.version!==expectedVersion)throw new VersionConflictError();return mapped(await this.databases.updateDocument(this.databaseId,this.collectionId,id,{...patch,version:expectedVersion+1}))}
}
