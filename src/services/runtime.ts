import { readServerEnvironment } from "@/src/config/env";
import { resolveRequestContext } from "@/src/auth/appwrite-context";
import { resolveDemoContext } from "@/src/demo/context";
import { DemoAuditRepository, DemoMatterRepository, DemoWorkflowRepository } from "@/src/demo/repositories";
import { createMatterService as createAppwriteMatterService } from "@/src/appwrite/services";
import { AuditService } from "./audit-service";
import { MatterService } from "./matter-service";
import { WorkflowService } from "./workflow-service";

const demoAudit=new DemoAuditRepository();
const demoMatters=new DemoMatterRepository();
const demoWorkflows=new DemoWorkflowRepository();
const auditService=new AuditService(demoAudit);

export const dataMode=()=>readServerEnvironment().IGOS_DATA_MODE;

export function createRuntimeMatterService(){return dataMode()==="demo"?new MatterService(demoMatters,auditService):createAppwriteMatterService()}
export function createRuntimeWorkflowService(){if(dataMode()!=="demo")throw new Error("Appwrite workflow persistence will be enabled with the live project migration");return new WorkflowService(demoWorkflows,auditService)}
export async function resolveRuntimeContext(request:Request,matId:string){return dataMode()==="demo"?resolveDemoContext(request,matId):resolveRequestContext(request,matId)}
