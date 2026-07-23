import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveRuntimeContext } from "@/src/services/runtime";
import { governanceRuntime } from "@/src/services/governance-runtime";

const scopeSchema = z.object({ matId: z.string().min(1), academyId: z.string().min(1).optional() });
const policySchema = z.object({ id: z.string().min(1), matId: z.string().min(1), academyIds: z.array(z.string().min(1)), title: z.string().min(3).max(512), ownerUserId: z.string().min(1), version: z.string().min(1).max(32), status: z.enum(["draft", "in-review", "approved", "published", "retired"]), reviewDueAt: z.string().datetime({ offset: true }), documentId: z.string().min(1), approvedByUserId: z.string().optional(), approvedAt: z.string().datetime({ offset: true }).optional(), publishedAt: z.string().datetime({ offset: true }).optional(), supersedesPolicyId: z.string().optional() });
const error = (value: unknown) => NextResponse.json({ error: value instanceof Error ? value.message : "Unexpected error" }, { status: 400 });

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = scopeSchema.parse({ matId: url.searchParams.get("matId"), academyId: url.searchParams.get("academyId") ?? undefined });
    const context = await resolveRuntimeContext(request, scope.matId);
    return NextResponse.json({ policies: await governanceRuntime().policy.list(context, scope) });
  } catch (cause) { return error(cause); }
}

export async function POST(request: Request) {
  try {
    const input = policySchema.parse(await request.json());
    const scope = { matId: input.matId, academyId: input.academyIds.length === 1 ? input.academyIds[0] : undefined };
    const context = await resolveRuntimeContext(request, input.matId);
    return NextResponse.json({ policy: await governanceRuntime().policy.save(context, scope, input) }, { status: 201 });
  } catch (cause) { return error(cause); }
}
