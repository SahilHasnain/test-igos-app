import { NextResponse } from "next/server";
import { resolveRuntimeContext, createRuntimeDeadlineAdjustmentRepository } from "@/src/services/runtime";

function errorStatus(message: string) {
  if (message.includes("permission")) return 403;
  if (message.includes("not found")) return 404;
  if (message.includes("required") || message.includes("outside")) return 400;
  return 500;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    const matterId = url.searchParams.get("matterId");
    if (!matId || !matterId) return NextResponse.json({ error: "matId and matterId are required" }, { status: 400 });
    const context = await resolveRuntimeContext(request, matId);
    const repo = createRuntimeDeadlineAdjustmentRepository();
    const adjustments = await repo.listByMatterId({ matId }, matterId);
    return NextResponse.json({ adjustments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId, matterId, ...adjustment } = body;
    if (!matId || !matterId) return NextResponse.json({ error: "matId and matterId are required" }, { status: 400 });
    const context = await resolveRuntimeContext(request, matId);
    const repo = createRuntimeDeadlineAdjustmentRepository();
    const saved = await repo.save({ matId }, matterId, adjustment);
    return NextResponse.json({ adjustment: saved }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
