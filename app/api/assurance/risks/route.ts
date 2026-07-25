import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext, createRuntimeAssuranceServices } from "@/src/services/runtime";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const academyId = url.searchParams.get("academyId") ?? undefined;
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAssuranceServices();
    const risks = await services.risks.list(context, { matId, academyId });
    return apiOk({ risks });
  } catch (error) {
    return apiError("GET", "/api/assurance/risks", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId, academyId } = body;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAssuranceServices();
    const risk = await services.risks.save(context, { matId, academyId }, body);
    return apiOk({ risk }, 201);
  } catch (error) {
    return apiError("POST", "/api/assurance/risks", error);
  }
}
