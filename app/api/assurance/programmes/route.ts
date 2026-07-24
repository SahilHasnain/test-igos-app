import { NextResponse } from "next/server";
import { resolveRuntimeContext, createRuntimeAssuranceServices } from "@/src/services/runtime";

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
    if (!matId) return NextResponse.json({ error: "matId is required" }, { status: 400 });
    const academyId = url.searchParams.get("academyId") ?? undefined;
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAssuranceServices();
    const programmes = await services.programmes.list(context, { matId, academyId });
    return NextResponse.json({ programmes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId } = body;
    if (!matId) return NextResponse.json({ error: "matId is required" }, { status: 400 });
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAssuranceServices();
    const programme = await services.programmes.save(context, { matId }, body);
    return NextResponse.json({ programme }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: errorStatus(message) });
  }
}
