import { NextResponse } from "next/server";
import { z } from "zod";
import type { DpiaRisk, DpiaSection } from "@/src/domain/dpia";
import { resolveRuntimeContext } from "@/src/services/runtime";
import { governanceRuntime } from "@/src/services/governance-runtime";

const scopeSchema = z.object({ matId: z.string().min(1), academyId: z.string().min(1).optional() });
const sectionSchema = z.object({ id: z.string().min(1), title: z.string().min(2), assignedRole: z.enum(["requester", "supplier", "compliance", "dpo"]), assignedUserId: z.string().optional(), status: z.enum(["not-started", "in-progress", "submitted", "accepted", "changes-requested"]), answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()])), submittedAt: z.string().datetime({ offset: true }).optional(), acceptedAt: z.string().datetime({ offset: true }).optional() });
const riskSchema = z.object({ id: z.string().min(1), description: z.string().min(3), affectedPeople: z.array(z.string()).min(1), likelihood: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]), impact: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]), controlEffectiveness: z.number().min(0).max(100), mitigations: z.array(z.string()), ownerUserId: z.string().min(1), dueAt: z.string().datetime({ offset: true }).optional(), acceptedByUserId: z.string().optional(), acceptanceRationale: z.string().optional() });
const commandSchema = z.discriminatedUnion("action", [z.object({ action: z.literal("save-section"), section: sectionSchema }), z.object({ action: z.literal("save-risk"), risk: riskSchema }), z.object({ action: z.literal("approve") })]);

export async function GET(request: Request, { params }: { params: Promise<{ matterId: string }> }) {
  try {
    const url = new URL(request.url);
    const scope = scopeSchema.parse({ matId: url.searchParams.get("matId"), academyId: url.searchParams.get("academyId") ?? undefined });
    const { matterId } = await params;
    const context = await resolveRuntimeContext(request, scope.matId);
    const runtime = governanceRuntime();
    const [sections, risks] = await Promise.all([
      runtime.dpia.listSections(context, scope, matterId) as Promise<readonly DpiaSection[]>,
      runtime.dpia.listRisks(context, scope, matterId) as Promise<readonly DpiaRisk[]>,
    ]);
    return NextResponse.json({ sections, risks });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unexpected error" }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ matterId: string }> }) {
  try {
    const url = new URL(request.url);
    const scope = scopeSchema.parse({ matId: url.searchParams.get("matId"), academyId: url.searchParams.get("academyId") ?? undefined });
    const command = commandSchema.parse(await request.json());
    const { matterId } = await params;
    const context = await resolveRuntimeContext(request, scope.matId);
    if (command.action === "save-section") return NextResponse.json({ section: await governanceRuntime().dpia.saveSection(context, scope, matterId, command.section as DpiaSection) });
    if (command.action === "save-risk") return NextResponse.json({ risk: await governanceRuntime().dpia.saveRisk(context, scope, matterId, command.risk as DpiaRisk) });
    return NextResponse.json(await governanceRuntime().dpia.approve(context, scope, matterId));
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unexpected error" }, { status: 400 });
  }
}
