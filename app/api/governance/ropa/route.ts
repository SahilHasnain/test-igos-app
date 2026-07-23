import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveRuntimeContext } from "@/src/services/runtime";
import { governanceRuntime } from "@/src/services/governance-runtime";

const scopeSchema = z.object({ matId: z.string().min(1), academyId: z.string().min(1).optional() });
const error = (value: unknown) => NextResponse.json({ error: value instanceof Error ? value.message : "Unexpected error" }, { status: 400 });

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = scopeSchema.parse({ matId: url.searchParams.get("matId"), academyId: url.searchParams.get("academyId") ?? undefined });
    const context = await resolveRuntimeContext(request, scope.matId);
    return NextResponse.json({ activities: await governanceRuntime().ropa.list(context, scope) });
  } catch (cause) { return error(cause); }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const scope = scopeSchema.parse(input);
    const context = await resolveRuntimeContext(request, scope.matId);
    return NextResponse.json({ activity: await governanceRuntime().ropa.save(context, scope, input) }, { status: 201 });
  } catch (cause) { return error(cause); }
}
