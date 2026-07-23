import type { RequestContext } from "@/src/auth/context";
import type { Role } from "@/src/domain/model";

export function resolveDemoContext(request:Request,matId:string):RequestContext {
  const userId=request.headers.get("x-demo-user-id")??"demo-dpo";
  const roles=(request.headers.get("x-demo-roles")?.split(",").filter(Boolean)??["dpo"]) as Role[];
  const academyIds=request.headers.get("x-demo-academies")?.split(",").filter(Boolean)??[];
  return {
    user:{id:userId,email:`${userId}@demo.igos.local`,name:"Demo IGOS User"},
    membership:{userId,matId,academyIds,roles},
    correlationId:request.headers.get("x-correlation-id")??crypto.randomUUID()
  };
}
