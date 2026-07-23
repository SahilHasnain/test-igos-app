import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveRequestContext } from "@/src/auth/appwrite-context";
import { createMatterService } from "@/src/appwrite/services";

const createSchema = z.object({
  matId: z.string().min(1),
  academyId: z.string().min(1).optional(),
  reference: z.string().min(3).max(64),
  type: z.enum(["sar","foi","breach","dpia"]),
  title: z.string().min(3).max(512),
  ownerUserId: z.string().min(1),
  statutoryDueAt: z.string().datetime().optional()
});

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = message.includes("required") || message.includes("membership") ? 401 : message.includes("permission") ? 403 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = z.string().min(1).parse(url.searchParams.get("matId"));
    const academyId = url.searchParams.get("academyId") ?? undefined;
    const type = z.enum(["sar","foi","breach","dpia"]).optional().parse(url.searchParams.get("type") ?? undefined);
    const status = z.enum(["draft","open","awaiting-information","review","approved","closed"]).optional().parse(url.searchParams.get("status") ?? undefined);
    const context = await resolveRequestContext(request, matId);
    const matters = await createMatterService().list(context, { matId, academyId, type, status });
    return NextResponse.json({ matters });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const input = createSchema.parse(await request.json());
    const context = await resolveRequestContext(request, input.matId);
    const matter = await createMatterService().create(context, input);
    return NextResponse.json({ matter }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
