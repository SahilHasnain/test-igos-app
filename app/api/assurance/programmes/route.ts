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
    const programmes = await services.programmes.list(context, { matId, academyId });
    return apiOk({ programmes });
  } catch (error) {
    return apiError("GET", "/api/assurance/programmes", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId } = body;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAssuranceServices();
    const programme = await services.programmes.save(context, { matId }, body);
    return apiOk({ programme }, 201);
  } catch (error) {
    return apiError("POST", "/api/assurance/programmes", error);
  }
}
