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
    const findings = await services.findings.list(context, { matId, academyId });
    return apiOk({ findings });
  } catch (error) {
    return apiError("GET", "/api/assurance/findings", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId, academyId } = body;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAssuranceServices();
    const finding = await services.findings.save(context, { matId, academyId }, body);
    return apiOk({ finding }, 201);
  } catch (error) {
    return apiError("POST", "/api/assurance/findings", error);
  }
}
