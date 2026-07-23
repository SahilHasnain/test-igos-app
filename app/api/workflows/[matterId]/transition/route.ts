import { NextResponse } from "next/server";
import { z } from "zod";
import { createRuntimeWorkflowService, resolveRuntimeContext } from "@/src/services/runtime";

const schema=z.object({
  matId:z.string().min(1),
  academyId:z.string().min(1).optional(),
  to:z.string().min(1),
  expectedVersion:z.number().int().positive(),
  reason:z.string().max(2000).optional(),
  assignedUserId:z.string().min(1).optional()
});

export async function POST(request:Request,{params}:{params:Promise<{matterId:string}>}){
  try{
    const {matterId}=await params;
    const input=schema.parse(await request.json());
    const context=await resolveRuntimeContext(request,input.matId);
    const workflow=await createRuntimeWorkflowService().transition(context,{...input,matterId,to:input.to as never});
    return NextResponse.json({workflow});
  }catch(error){
    const message=error instanceof Error?error.message:"Unexpected error";
    const status=message.includes("permission")?403:message.includes("not found")?404:400;
    return NextResponse.json({error:message},{status});
  }
}
