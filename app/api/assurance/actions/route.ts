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
    const actions = await services.actions.list(context, { matId, academyId });
    return apiOk({ actions });
  } catch (error) {
    return apiError("GET", "/api/assurance/actions", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId, academyId } = body;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAssuranceServices();
    const action = await services.actions.save(context, { matId, academyId }, body);
    return apiOk({ action }, 201);
  } catch (error) {
    return apiError("POST", "/api/assurance/actions", error);
  }
}
