import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveRuntimeContext } from "@/src/services/runtime";
import { governanceRuntime } from "@/src/services/governance-runtime";

const inputSchema = z.object({ matId: z.string().min(1), academyId: z.string().min(1).optional(), to: z.enum(["draft", "in-review", "approved", "published", "retired"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = inputSchema.parse(await request.json());
    const { id } = await params;
    const context = await resolveRuntimeContext(request, input.matId);
    return NextResponse.json({ policy: await governanceRuntime().policy.transition(context, input, id, input.to) });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unexpected error" }, { status: 400 });
  }
}
