import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveRequestContext } from "@/src/auth/appwrite-context";
import { createMatterService } from "@/src/appwrite/services";

const scopeSchema = z.object({ matId:z.string().min(1), academyId:z.string().min(1).optional() });
const patchSchema = z.object({
  matId:z.string().min(1),
  academyId:z.string().min(1).optional(),
  expectedVersion:z.number().int().positive(),
  title:z.string().min(3).max(512).optional(),
  status:z.enum(["draft","open","awaiting-information","review","approved","closed"]).optional(),
  ownerUserId:z.string().min(1).optional(),
  statutoryDueAt:z.string().datetime().nullable().optional()
});

const failure=(error:unknown)=>NextResponse.json({error:error instanceof Error?error.message:"Unexpected error"},{status:400});

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const {id}=await params;
    const url=new URL(request.url);
    const scope=scopeSchema.parse({matId:url.searchParams.get("matId"),academyId:url.searchParams.get("academyId")??undefined});
    const context=await resolveRequestContext(request,scope.matId);
    return NextResponse.json({matter:await createMatterService().get(context,scope,id)});
  } catch(error){return failure(error)}
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const {id}=await params;
    const input=patchSchema.parse(await request.json());
    const {matId,academyId,expectedVersion,...patch}=input;
    const context=await resolveRequestContext(request,matId);
    return NextResponse.json({matter:await createMatterService().update(context,{matId,academyId},id,expectedVersion,patch)});
  } catch(error){return failure(error)}
}
