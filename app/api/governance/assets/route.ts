import { apiError, apiOk } from "@/src/lib/api-handler";
import { resolveRuntimeContext, createRuntimeAdvancedGovernanceServices } from "@/src/services/runtime";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const matId = url.searchParams.get("matId");
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const academyId = url.searchParams.get("academyId") ?? undefined;
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAdvancedGovernanceServices();
    const assets = await services.assets.list(context, { matId, academyId });
    return apiOk({ assets });
  } catch (error) {
    return apiError("GET", "/api/governance/assets", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matId, academyId } = body;
    if (!matId) return apiOk({ error: "matId is required" }, 400);
    const context = await resolveRuntimeContext(request, matId);
    const services = createRuntimeAdvancedGovernanceServices();
    const asset = await services.assets.save(context, { matId, academyId }, body);
    return apiOk({ asset }, 201);
  } catch (error) {
    return apiError("POST", "/api/governance/assets", error);
  }
}
